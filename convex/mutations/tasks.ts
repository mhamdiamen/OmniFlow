import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { createActivityForUser } from "./recentActivity";

// Create a new task with subtasks
export const createTask = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    assigneeId: v.optional(v.id("users")),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("on_hold"),
      v.literal("canceled")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    dueDate: v.optional(v.float64()),
    subtasks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          label: v.string(),
          completed: v.boolean(),
          createdAt: v.optional(v.float64()),
          completedAt: v.optional(v.float64()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { projectId, name, description, assigneeId, status, priority, dueDate, subtasks } = args;

    // Get authenticated user
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Fetch creator user data
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Fetch project
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Validate subtasks - must have at least one
    if (!subtasks || subtasks.length === 0) {
      throw new Error("Tasks must have at least one subtask");
    }

    // Calculate initial progress based on subtasks
    const completedSubtasks = subtasks.filter(st => st.completed).length;
    const progress = Math.round((completedSubtasks / subtasks.length) * 100);

    // Create the task
    const taskId = await ctx.db.insert("tasks", {
      projectId,
      name,
      description,
      assigneeId,
      status,
      priority,
      dueDate,
      subtasks: subtasks.map(st => ({
        ...st,
        createdAt: st.createdAt || Date.now(),
        completedAt: st.completed ? (st.completedAt || Date.now()) : undefined
      })),
      progress,
      createdBy: user._id,
      ...(status === "completed" ? {
        completedAt: Date.now(),
        completedBy: user._id
      } : {})
    });

    // Update project task counts
    if (project.totalTasks !== undefined) {
      const newTotalTasks = (project.totalTasks || 0) + 1;
      await ctx.db.patch(projectId, {
        totalTasks: newTotalTasks,
        ...(status === "completed" ? {
          completedTasks: (project.completedTasks || 0) + 1
        } : {}),
        progress: newTotalTasks > 0
          ? Math.round(
            ((project.completedTasks || 0) + (status === "completed" ? 1 : 0)) /
            newTotalTasks * 100
          )
          : 0
      });
    }

    // 🔔 Activity logging

    // Log activity for the task creator
    await createActivityForUser(ctx, {
      userId: user._id,
      actionType: "Created Task",
      targetId: taskId,
      targetType: "task",
      description: `Task "${name}" created in project "${project.name}" with ${subtasks.length} subtasks`,
      metadata: {
        taskId,
        projectId,
        status,
        priority,
        createdBy: user._id,
        subtasksCount: subtasks.length,
        initialProgress: progress
      }
    });

    // Log creation of each subtask
    for (const subtask of subtasks) {
      await createActivityForUser(ctx, {
        userId: user._id,
        actionType: "Created Subtask",
        targetId: taskId,
        targetType: "task",
        description: `Subtask "${subtask.label}" created in task "${name}"`,
        metadata: {
          taskId,
          projectId,
          subtaskId: subtask.id,
          subtaskLabel: subtask.label,
          completed: subtask.completed
        }
      });
    }

    // Log activity for the assignee (if provided)
    if (assigneeId) {
      await createActivityForUser(ctx, {
        userId: assigneeId,
        actionType: "Assigned to Task",
        targetId: taskId,
        targetType: "task",
        description: `Task "${name}" assigned in project "${project.name}"`,
        metadata: {
          assignedBy: user._id,
          taskId,
          projectId,
          taskName: name,
          projectName: project.name,
          subtasksCount: subtasks.length
        }
      });
    }

    return taskId;
  },
});

// Update an existing task with subtasks
export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    assigneeId: v.optional(v.id("users")),
    status: v.optional(v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("on_hold"),
      v.literal("canceled")
    )),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
    dueDate: v.optional(v.float64()),
    subtasks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          label: v.string(),
          completed: v.boolean(),
          createdAt: v.optional(v.float64()),
          completedAt: v.optional(v.float64()),
        })
      )
    ),
    updatedSubtaskId: v.optional(v.string()), // For assignee updates
  },
  handler: async (ctx, args) => {
    const { taskId, subtasks, updatedSubtaskId, ...updates } = args;

    // Get current user
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Fetch user
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Fetch task
    const task = await ctx.db.get(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    // Fetch project
    const project = await ctx.db.get(task.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Track previous values for activity logs
    const oldStatus = task.status;
    const oldPriority = task.priority;
    const oldAssigneeId = task.assigneeId;
    const oldSubtasks = task.subtasks || [];

    // Determine if status/priority/due date changed
    const isStatusChanged = updates.status && updates.status !== oldStatus;
    const isPriorityChanged = updates.priority && updates.priority !== oldPriority;
    const isDueDateChanged = updates.dueDate && updates.dueDate !== task.dueDate;
    const isAssigneeChanged = updates.assigneeId && updates.assigneeId !== oldAssigneeId;
    const isSubtasksChanged = subtasks !== undefined;

    // Handle subtask updates
    let newSubtasks = oldSubtasks;
    let subtaskDeltas = {
      added: [] as any[],
      removed: [] as any[],
      updated: [] as any[],
    };

    if (isSubtasksChanged) {
      // Full subtasks replacement (manager use case)
      if (subtasks) {
        // Validate at least one subtask
        if (subtasks.length === 0) {
          throw new Error("Tasks must have at least one subtask");
        }

        // Find differences
        const oldSubtaskIds = new Set(oldSubtasks.map(st => st.id));
        const newSubtaskIds = new Set(subtasks.map(st => st.id));

        subtaskDeltas.added = subtasks.filter(st => !oldSubtaskIds.has(st.id));
        subtaskDeltas.removed = oldSubtasks.filter(st => !newSubtaskIds.has(st.id));
        subtaskDeltas.updated = subtasks.filter(newSt => {
          const oldSt = oldSubtasks.find(st => st.id === newSt.id);
          return oldSt && (oldSt.completed !== newSt.completed || oldSt.label !== newSt.label);
        });

        newSubtasks = subtasks.map(st => ({
          ...st,
          createdAt: st.createdAt || oldSubtasks.find(ost => ost.id === st.id)?.createdAt || Date.now(),
          completedAt: st.completed
            ? (st.completedAt || oldSubtasks.find(ost => ost.id === st.id)?.completedAt || Date.now())
            : undefined
        }));
      }
    } else if (updatedSubtaskId) {
      // Single subtask update (assignee use case)
      const subtaskToUpdate = oldSubtasks.find(st => st.id === updatedSubtaskId);
      if (!subtaskToUpdate) {
        throw new Error("Subtask not found");
      }

      // Only allow toggling completion status for assignee
      newSubtasks = oldSubtasks.map(st => {
        if (st.id === updatedSubtaskId) {
          return {
            ...st,
            completed: !st.completed,
            completedAt: !st.completed ? Date.now() : undefined
          };
        }
        return st;
      });

      subtaskDeltas.updated = [{
        id: updatedSubtaskId,
        oldCompleted: subtaskToUpdate.completed,
        newCompleted: !subtaskToUpdate.completed
      }];
    }

    // Calculate new progress based on subtasks
    const completedSubtasks = newSubtasks.filter(st => st.completed).length;
    const progress = newSubtasks.length > 0
      ? Math.round((completedSubtasks / newSubtasks.length) * 100)
      : 0;
    // Prepare update object
    const updateObj: any = {
      ...updates,
      ...(isSubtasksChanged || updatedSubtaskId ? { subtasks: newSubtasks, progress } : {})
    };

    // Automatically update task status based on subtask completion
    if (isSubtasksChanged || updatedSubtaskId) {
      if (completedSubtasks === newSubtasks.length && newSubtasks.length > 0) {
        updateObj.status = "completed";
        updateObj.completedAt = Date.now();
        updateObj.completedBy = user._id;
      } else if (task.status === "completed") {
        updateObj.status = "in_progress";
        updateObj.completedAt = undefined;
        updateObj.completedBy = undefined;
      }
    }


    // Detect if the task was completed or uncompleted during this update
    let isCompletingTask = false;
    let isUncompletingTask = false;

    // First, check if the task status changed via direct update
    if (updates.status !== undefined) {
      isCompletingTask = updates.status === "completed" && task.status !== "completed";
      isUncompletingTask = task.status === "completed" && updates.status !== "completed";
    }

    // Then, check if the task was auto-completed due to subtasks
    if (!isCompletingTask && !isUncompletingTask && updateObj.status !== undefined) {
      const oldStatus = task.status;
      const newStatus = updateObj.status;

      isCompletingTask = newStatus === "completed" && oldStatus !== "completed";
      isUncompletingTask = oldStatus === "completed" && newStatus !== "completed";
    }

    // Apply completion timestamps accordingly
    if (isCompletingTask) {
      updateObj.completedAt = Date.now();
      updateObj.completedBy = user._id;
    } else if (isUncompletingTask) {
      updateObj.completedAt = undefined;
      updateObj.completedBy = undefined;
    }

    // Update the task
    await ctx.db.patch(taskId, updateObj);

    // Log activity for task updater
    await createActivityForUser(ctx, {
      userId: user._id,
      actionType: "Updated Task",
      targetId: taskId,
      targetType: "task",
      description: `Updated task "${task.name}" in project "${project.name}"`,
      metadata: {
        taskId,
        projectId: task.projectId,
        updatedFields: Object.keys(updates),
        oldStatus,
        newStatus: isStatusChanged ? updates.status : oldStatus,
        oldPriority,
        newPriority: isPriorityChanged ? updates.priority : oldPriority,
        oldAssigneeId,
        newAssigneeId: isAssigneeChanged ? updates.assigneeId : oldAssigneeId,
        projectName: project.name,
        ...(isSubtasksChanged || updatedSubtaskId ? {
          newProgress: progress,
          oldProgress: task.progress || 0
        } : {})
      }
    });

    // Log subtask changes
    if (isSubtasksChanged || updatedSubtaskId) {
      // Log added subtasks
      for (const added of subtaskDeltas.added) {
        await createActivityForUser(ctx, {
          userId: user._id,
          actionType: "Added Subtask",
          targetId: taskId,
          targetType: "task",
          description: `Added subtask "${added.label}" to task "${task.name}"`,
          metadata: {
            taskId,
            projectId: task.projectId,
            subtaskId: added.id,
            subtaskLabel: added.label,
            completed: added.completed
          }
        });
      }

      // Log removed subtasks
      for (const removed of subtaskDeltas.removed) {
        await createActivityForUser(ctx, {
          userId: user._id,
          actionType: "Removed Subtask",
          targetId: taskId,
          targetType: "task",
          description: `Removed subtask "${removed.label}" from task "${task.name}"`,
          metadata: {
            taskId,
            projectId: task.projectId,
            subtaskId: removed.id,
            subtaskLabel: removed.label
          }
        });
      }

      // Log updated subtasks
      for (const updated of subtaskDeltas.updated) {
        const subtask = newSubtasks.find(st => st.id === updated.id);
        if (!subtask) continue;

        await createActivityForUser(ctx, {
          userId: user._id,
          actionType: "Updated Subtask",
          targetId: taskId,
          targetType: "task",
          description: `Updated subtask "${subtask.label}" in task "${task.name}"`,
          metadata: {
            taskId,
            projectId: task.projectId,
            subtaskId: subtask.id,
            subtaskLabel: subtask.label,
            ...(updated.oldCompleted !== undefined ? {
              oldCompleted: updated.oldCompleted,
              newCompleted: subtask.completed
            } : {})
          }
        });
      }
    }

    // Notify previous assignee if unassigned
    if (oldAssigneeId && isAssigneeChanged && updates.assigneeId !== oldAssigneeId) {
      await createActivityForUser(ctx, {
        userId: oldAssigneeId,
        actionType: "Removed from Task",
        targetId: taskId,
        targetType: "task",
        description: `Removed from task "${task.name}" in project "${project.name}"`,
        metadata: {
          removedBy: user._id,
          taskId,
          projectId: task.projectId,
          projectName: project.name
        }
      });
    }

    // Notify new assignee if assigned
    if (isAssigneeChanged && updates.assigneeId) {
      await createActivityForUser(ctx, {
        userId: updates.assigneeId,
        actionType: "Assigned to Task",
        targetId: taskId,
        targetType: "task",
        description: `Assigned to task "${task.name}" in project "${project.name}"`,
        metadata: {
          assignedBy: user._id,
          taskId,
          projectId: task.projectId,
          taskName: task.name,
          projectName: project.name,
          subtasksCount: newSubtasks.length
        }
      });
    }

    // Update project stats if needed
    if (isCompletingTask || isUncompletingTask) {
      const project = await ctx.db.get(task.projectId);
      if (project) {
        const newCompletedTasks = Math.max(
          0,
          (project.completedTasks || 0) + (isCompletingTask ? 1 : -1)
        );
        await ctx.db.patch(task.projectId, {
          completedTasks: newCompletedTasks,
          progress: project.totalTasks
            ? Math.round(newCompletedTasks / project.totalTasks * 100)
            : 0
        });
      }
    }

    return taskId;
  },
});
// Delete a task (updated to handle subtasks)
export const deleteTask = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const { taskId } = args;

    // Get current user
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get user
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get task
    const task = await ctx.db.get(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    // Get project
    const project = await ctx.db.get(task.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Log subtask deletion activities first
    if (task.subtasks && task.subtasks.length > 0) {
      for (const subtask of task.subtasks) {
        await createActivityForUser(ctx, {
          userId: user._id,
          actionType: "Subtask Deleted",
          targetId: taskId,
          targetType: "task",
          description: `Subtask "${subtask.label}" deleted from task "${task.name}"`,
          metadata: {
            taskId,
            projectId: task.projectId,
            subtaskId: subtask.id,
            subtaskLabel: subtask.label,
            deletedBy: user._id
          }
        });
      }
    }

    // Delete task
    await ctx.db.delete(taskId);

    // Log deletion activity
    await createActivityForUser(ctx, {
      userId: user._id,
      actionType: "Deleted Task",
      targetId: taskId,
      targetType: "task",
      description: `Deleted task "${task.name}" with ${task.subtasks?.length || 0} subtasks from project "${project.name}"`,
      metadata: {
        taskId,
        projectId: task.projectId,
        taskName: task.name,
        projectName: project.name,
        subtasksCount: task.subtasks?.length || 0
      }
    });

    // Also notify assignee if exists
    if (task.assigneeId) {
      await createActivityForUser(ctx, {
        userId: task.assigneeId,
        actionType: "Removed from Task",
        targetId: taskId,
        targetType: "task",
        description: `Removed from task "${task.name}" in project "${project.name}" due to deletion`,
        metadata: {
          removedBy: user._id,
          taskId,
          projectId: task.projectId,
          projectName: project.name,
          subtasksCount: task.subtasks?.length || 0
        }
      });
    }

    // Update project task counts
    const newTotalTasks = Math.max(0, (project.totalTasks || 0) - 1);
    const newCompletedTasks = Math.max(
      0,
      (project.completedTasks || 0) - (task.status === "completed" ? 1 : 0)
    );

    await ctx.db.patch(task.projectId, {
      totalTasks: newTotalTasks,
      completedTasks: newCompletedTasks,
      progress: newTotalTasks > 0
        ? Math.round(newCompletedTasks / newTotalTasks * 100)
        : 0
    });

    return { success: true };
  },
});

// Bulk update tasks (updated to handle subtasks)
export const bulkUpdateTasks = mutation({
  args: {
    taskIds: v.array(v.id("tasks")),
    updates: v.object({
      assigneeId: v.optional(v.id("users")),
      status: v.optional(v.union(
        v.literal("todo"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("on_hold"),
        v.literal("canceled")
      )),
      priority: v.optional(v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("urgent")
      )),
      dueDate: v.optional(v.float64()),
      subtasks: v.optional(
        v.array(
          v.object({
            id: v.string(),
            label: v.string(),
            completed: v.boolean(),
            createdAt: v.optional(v.float64()),
            completedAt: v.optional(v.float64()),
          })
        )
      ),
    }),
  },
  handler: async (ctx, args) => {
    const { taskIds, updates } = args;

    // Get the current user using getAuthUserId
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Find the user in the database
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Track project updates for task completion changes
    const projectUpdates = new Map<Id<"projects">, {
      completedDelta: number,
      projectId: Id<"projects">,
      totalTasks?: number,
      completedTasks?: number
    }>();

    // Process each task
    for (const taskId of taskIds) {
      // Get the current task
      const task = await ctx.db.get(taskId);
      if (!task) continue;

      // Fetch project
      const project = await ctx.db.get(task.projectId);
      if (!project) continue;

      // Track previous values for logs
      const oldStatus = task.status;
      const oldPriority = task.priority;
      const oldAssigneeId = task.assigneeId;
      const oldSubtasks = task.subtasks || [];

      // Determine what changed
      const isStatusChanged = updates.status && updates.status !== oldStatus;
      const isPriorityChanged = updates.priority && updates.priority !== oldPriority;
      const isDueDateChanged = updates.dueDate && updates.dueDate !== task.dueDate;
      const isAssigneeChanged = updates.assigneeId && updates.assigneeId !== oldAssigneeId;
      const isSubtasksChanged = updates.subtasks !== undefined;

      // Handle subtask updates if provided
      let newSubtasks = oldSubtasks;
      let subtaskDeltas = {
        added: [] as any[],
        removed: [] as any[],
        updated: [] as any[],
      };

      if (isSubtasksChanged && updates.subtasks) {
        // Validate at least one subtask
        if (updates.subtasks.length === 0) {
          throw new Error("Tasks must have at least one subtask");
        }

        // Find differences
        const oldSubtaskIds = new Set(oldSubtasks.map(st => st.id));
        const newSubtaskIds = new Set(updates.subtasks.map(st => st.id));

        subtaskDeltas.added = updates.subtasks.filter(st => !oldSubtaskIds.has(st.id));
        subtaskDeltas.removed = oldSubtasks.filter(st => !newSubtaskIds.has(st.id));
        subtaskDeltas.updated = updates.subtasks.filter(newSt => {
          const oldSt = oldSubtasks.find(st => st.id === newSt.id);
          return oldSt && (oldSt.completed !== newSt.completed || oldSt.label !== newSt.label);
        });

        newSubtasks = updates.subtasks.map(st => ({
          ...st,
          createdAt: st.createdAt || oldSubtasks.find(ost => ost.id === st.id)?.createdAt || Date.now(),
          completedAt: st.completed
            ? (st.completedAt || oldSubtasks.find(ost => ost.id === st.id)?.completedAt || Date.now())
            : undefined
        }));
      }

      // Calculate new progress if subtasks changed
      const progress = isSubtasksChanged && updates.subtasks
        ? updates.subtasks.length > 0
          ? Math.round((updates.subtasks.filter(st => st.completed).length / updates.subtasks.length) * 100)
          : 0
        : task.progress || 0;

      // Check if status is changing to/from completed
      const isCompletingTask = updates.status === "completed" && task.status !== "completed";
      const isUncompletingTask = task.status === "completed" && updates.status && updates.status !== "completed";

      // Prepare the update object
      const updateObj: any = { ...updates };
      if (isSubtasksChanged) {
        updateObj.subtasks = newSubtasks;
        updateObj.progress = progress;
      }

      // If task is being completed, add completion details
      if (isCompletingTask) {
        updateObj.completedAt = Date.now();
        updateObj.completedBy = user._id;
      } else if (isUncompletingTask) {
        // If task is being uncompleted, remove completion details
        updateObj.completedAt = undefined;
        updateObj.completedBy = undefined;
      }

      // Update the task
      await ctx.db.patch(taskId, updateObj);

      // Log activity for task updater
      await createActivityForUser(ctx, {
        userId: user._id,
        actionType: "Updated Task",
        targetId: taskId,
        targetType: "task",
        description: `Updated task "${task.name}" in project "${project.name}"`,
        metadata: {
          taskId,
          projectId: task.projectId,
          updatedFields: Object.keys(updates),
          oldStatus,
          newStatus: isStatusChanged ? updates.status : oldStatus,
          oldPriority,
          newPriority: isPriorityChanged ? updates.priority : oldPriority,
          oldAssigneeId,
          newAssigneeId: isAssigneeChanged ? updates.assigneeId : oldAssigneeId,
          projectName: project.name,
          ...(isSubtasksChanged ? {
            subtasksAdded: subtaskDeltas.added.length,
            subtasksRemoved: subtaskDeltas.removed.length,
            subtasksUpdated: subtaskDeltas.updated.length,
            newProgress: progress,
            oldProgress: task.progress || 0
          } : {})
        }
      });

      // Log subtask changes if any
      if (isSubtasksChanged) {
        // Log added subtasks
        for (const added of subtaskDeltas.added) {
          await createActivityForUser(ctx, {
            userId: user._id,
            actionType: "Added Subtask",
            targetId: taskId,
            targetType: "task",
            description: `Added subtask "${added.label}" to task "${task.name}"`,
            metadata: {
              taskId,
              projectId: task.projectId,
              subtaskId: added.id,
              subtaskLabel: added.label,
              completed: added.completed
            }
          });
        }

        // Log removed subtasks
        for (const removed of subtaskDeltas.removed) {
          await createActivityForUser(ctx, {
            userId: user._id,
            actionType: "Removed Subtask",
            targetId: taskId,
            targetType: "task",
            description: `Removed subtask "${removed.label}" from task "${task.name}"`,
            metadata: {
              taskId,
              projectId: task.projectId,
              subtaskId: removed.id,
              subtaskLabel: removed.label
            }
          });
        }

        // Log updated subtasks
        for (const updated of subtaskDeltas.updated) {
          const subtask = newSubtasks.find(st => st.id === updated.id);
          if (!subtask) continue;

          await createActivityForUser(ctx, {
            userId: user._id,
            actionType: "Updated Subtask",
            targetId: taskId,
            targetType: "task",
            description: `Updated subtask "${subtask.label}" in task "${task.name}"`,
            metadata: {
              taskId,
              projectId: task.projectId,
              subtaskId: subtask.id,
              subtaskLabel: subtask.label,
              oldCompleted: oldSubtasks.find(st => st.id === subtask.id)?.completed,
              newCompleted: subtask.completed
            }
          });
        }
      }

      // Notify previous assignee if unassigned
      if (oldAssigneeId && isAssigneeChanged && updates.assigneeId !== oldAssigneeId) {
        await createActivityForUser(ctx, {
          userId: oldAssigneeId,
          actionType: "Removed from Task",
          targetId: taskId,
          targetType: "task",
          description: `Removed from task "${task.name}" in project "${project.name}"`,
          metadata: {
            removedBy: user._id,
            taskId,
            projectId: task.projectId,
            projectName: project.name
          }
        });
      }

      // Notify new assignee if assigned
      if (isAssigneeChanged && updates.assigneeId) {
        await createActivityForUser(ctx, {
          userId: updates.assigneeId,
          actionType: "Assigned to Task",
          targetId: taskId,
          targetType: "task",
          description: `Assigned to task "${task.name}" in project "${project.name}"`,
          metadata: {
            assignedBy: user._id,
            taskId,
            projectId: task.projectId,
            taskName: task.name,
            projectName: project.name,
            subtasksCount: newSubtasks.length
          }
        });
      }

      // Track project updates if status changed
      if (isCompletingTask || isUncompletingTask) {
        const delta = isCompletingTask ? 1 : -1;

        if (!projectUpdates.has(task.projectId)) {
          const project = await ctx.db.get(task.projectId);
          if (project) {
            projectUpdates.set(task.projectId, {
              completedDelta: delta,
              projectId: task.projectId,
              totalTasks: project.totalTasks,
              completedTasks: project.completedTasks
            });
          }
        } else {
          const update = projectUpdates.get(task.projectId)!;
          update.completedDelta += delta;
        }
      }
    }

    // Apply project updates
    for (const [projectId, update] of projectUpdates.entries()) {
      if (update.completedDelta !== 0) {
        const newCompletedTasks = Math.max(0, (update.completedTasks || 0) + update.completedDelta);

        await ctx.db.patch(projectId, {
          completedTasks: newCompletedTasks,
          // Update progress percentage
          progress: update.totalTasks
            ? Math.round(newCompletedTasks / update.totalTasks * 100)
            : undefined
        });
      }
    }

    return { success: true, updatedCount: taskIds.length };
  },
});

// Bulk delete tasks (updated to handle subtasks)
export const bulkDeleteTasks = mutation({
  args: {
    taskIds: v.array(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    const { taskIds } = args;

    // Get the current user using getAuthUserId
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Find the user in the database
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Track the number of tasks deleted
    let deletedCount = 0;

    // Track project updates
    const projectUpdates = new Map<Id<"projects">, {
      totalDelta: number,
      completedDelta: number,
      projectId: Id<"projects">,
      totalTasks?: number,
      completedTasks?: number
    }>();

    for (const taskId of taskIds) {
      // Get the task
      const task = await ctx.db.get(taskId);
      if (!task) continue;

      // Fetch project
      const project = await ctx.db.get(task.projectId);
      if (!project) continue;

      // Initialize project tracking if not exists
      if (!projectUpdates.has(task.projectId)) {
        projectUpdates.set(task.projectId, {
          totalDelta: 0,
          completedDelta: 0,
          projectId: task.projectId,
          totalTasks: project.totalTasks,
          completedTasks: project.completedTasks
        });
      }

      const projectUpdate = projectUpdates.get(task.projectId)!;
      projectUpdate.totalDelta += 1;
      if (task.status === "completed") {
        projectUpdate.completedDelta += 1;
      }

      // Log subtask deletion activities first
      if (task.subtasks && task.subtasks.length > 0) {
        for (const subtask of task.subtasks) {
          await createActivityForUser(ctx, {
            userId: user._id,
            actionType: "Subtask Deleted",
            targetId: taskId,
            targetType: "task",
            description: `Subtask "${subtask.label}" deleted from task "${task.name}"`,
            metadata: {
              taskId,
              projectId: task.projectId,
              subtaskId: subtask.id,
              subtaskLabel: subtask.label,
              deletedBy: user._id
            }
          });
        }
      }

      // Save old assignee ID before deletion
      const oldAssigneeId = task.assigneeId;

      // Delete the task
      await ctx.db.delete(taskId);
      deletedCount++;

      // Log activity for the deleting user
      await createActivityForUser(ctx, {
        userId: user._id,
        actionType: "Deleted Task",
        targetId: taskId,
        targetType: "task",
        description: `Deleted task "${task.name}" with ${task.subtasks?.length || 0} subtasks from project "${project.name}"`,
        metadata: {
          taskId,
          projectId: task.projectId,
          taskName: task.name,
          projectName: project.name,
          deletedBy: user._id,
          status: task.status,
          assigneeId: task.assigneeId,
          subtasksCount: task.subtasks?.length || 0
        }
      });

      // Notify previous assignee if there was one
      if (oldAssigneeId) {
        await createActivityForUser(ctx, {
          userId: oldAssigneeId,
          actionType: "Task Deleted",
          targetId: taskId,
          targetType: "task",
          description: `Assigned task "${task.name}" was deleted from project "${project.name}"`,
          metadata: {
            deletedBy: user._id,
            taskId,
            projectId: task.projectId,
            projectName: project.name,
            taskName: task.name,
            subtasksCount: task.subtasks?.length || 0
          }
        });
      }
    }

    // Apply project updates
    for (const [projectId, update] of projectUpdates.entries()) {
      if (update.totalDelta > 0) {
        const newTotalTasks = Math.max(0, (update.totalTasks || 0) - update.totalDelta);
        const newCompletedTasks = Math.max(0, (update.completedTasks || 0) - update.completedDelta);

        await ctx.db.patch(projectId, {
          totalTasks: newTotalTasks,
          completedTasks: newCompletedTasks,
          progress: newTotalTasks > 0
            ? Math.round(newCompletedTasks / newTotalTasks * 100)
            : 0
        });
      }
    }

    return { success: true, deletedCount };
  },
});

// Update task status (updated to handle subtasks)
export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("on_hold"),
      v.literal("canceled")
    )
  },
  handler: async (ctx, args) => {
    const { taskId, status } = args;

    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Get current task
    const task = await ctx.db.get(taskId);
    if (!task) throw new Error("Task not found");

    const oldStatus = task.status;
    const isCompletingTask = status === "completed" && task.status !== "completed";
    const isUncompletingTask = task.status === "completed" && status !== "completed";

    const updateObj: any = { status };

    // Handle completion logic
    if (isCompletingTask) {
      updateObj.completedAt = Date.now();
      updateObj.completedBy = userId;
    } else if (isUncompletingTask) {
      updateObj.completedAt = undefined;
      updateObj.completedBy = undefined;
    }

    await ctx.db.patch(taskId, updateObj);

    // Create activity log
    if (status !== oldStatus) {
      const project = await ctx.db.get(task.projectId);
      await createActivityForUser(ctx, {
        userId,
        actionType: "Updated Task Status",
        targetId: taskId,
        targetType: "task",
        description: `Changed status from ${oldStatus} to ${status} for task "${task.name}"`,
        metadata: {
          taskId,
          projectId: task.projectId,
          oldStatus,
          newStatus: status,
          projectName: project?.name || "",
          subtasksCount: task.subtasks?.length || 0,
          subtasksCompleted: task.subtasks?.filter(st => st.completed).length || 0
        }
      });
    }

    // Update project stats if needed
    if (isCompletingTask || isUncompletingTask) {
      const project = await ctx.db.get(task.projectId);
      if (project) {
        const newCompletedTasks = Math.max(
          0,
          (project.completedTasks || 0) + (isCompletingTask ? 1 : -1)
        );
        await ctx.db.patch(task.projectId, {
          completedTasks: newCompletedTasks,
          progress: project.totalTasks
            ? Math.round(newCompletedTasks / project.totalTasks * 100)
            : 0
        });
      }
    }

    return taskId;
  }
});