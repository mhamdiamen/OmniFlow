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
          label: v.string(),
          position: v.number(),
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

    // Calculate initial progress - all subtasks start as "todo" so progress is 0
    const progress = 0;

    // Create the task first
    const taskId = await ctx.db.insert("tasks", {
      projectId,
      name,
      description,
      assigneeId,
      status,
      priority,
      dueDate,
      progress,
      createdBy: user._id,
      ...(status === "completed" ? {
        completedAt: Date.now(),
        completedBy: user._id
      } : {})
    });

    // Create subtasks in the separate subtasks table - all start as "todo"
    const createdSubtasks = [];
    for (const subtask of subtasks) {
      const subtaskId = await ctx.db.insert("subtasks", {
        taskId,
        label: subtask.label,
        status: "todo", // All new subtasks default to "todo"
        position: subtask.position,
        createdAt: Date.now(),
        createdBy: user._id,
      });

      createdSubtasks.push({
        id: subtaskId,
        ...subtask,
        status: "todo"
      });
    }

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
    for (let i = 0; i < createdSubtasks.length; i++) {
      const subtask = createdSubtasks[i];
      const originalSubtask = subtasks[i];

      await createActivityForUser(ctx, {
        userId: user._id,
        actionType: "Created Subtask",
        targetId: taskId,
        targetType: "task",
        description: `Subtask "${originalSubtask.label}" created in task "${name}"`,
        metadata: {
          taskId,
          projectId,
          subtaskId: subtask.id,
          subtaskLabel: originalSubtask.label,
          status: "todo", // All new subtasks start as "todo"
          position: originalSubtask.position
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
          id: v.optional(v.id("subtasks")), // For existing subtasks
          label: v.string(),
          status: v.union(
            v.literal("todo"),
            v.literal("in_progress"),
            v.literal("completed"),
            v.literal("on_hold"),
            v.literal("canceled")
          ),
          position: v.number(),
        })
      )
    ),
    updatedSubtaskId: v.optional(v.id("subtasks")), // For single subtask updates
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

    // Fetch current subtasks from separate table
    const currentSubtasks = await ctx.db
      .query("subtasks")
      .withIndex("taskId", (q) => q.eq("taskId", taskId))
      .collect();

    // Track previous values for activity logs
    const oldStatus = task.status;
    const oldPriority = task.priority;
    const oldAssigneeId = task.assigneeId;

    // Determine if status/priority/due date changed
    const isStatusChanged = updates.status && updates.status !== oldStatus;
    const isPriorityChanged = updates.priority && updates.priority !== oldPriority;
    const isDueDateChanged = updates.dueDate && updates.dueDate !== task.dueDate;
    const isAssigneeChanged = updates.assigneeId && updates.assigneeId !== oldAssigneeId;
    const isSubtasksChanged = subtasks !== undefined;

    // Handle subtask updates
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
        const currentSubtaskIds = new Set(currentSubtasks.map(st => st._id));
        const newSubtaskIds = new Set(subtasks.filter(st => st.id).map(st => st.id!));

        // Find subtasks to add (no id or id not in current)
        subtaskDeltas.added = subtasks.filter(st => !st.id || !currentSubtaskIds.has(st.id));

        // Find subtasks to remove (in current but not in new)
        subtaskDeltas.removed = currentSubtasks.filter(st => !newSubtaskIds.has(st._id));

        // Find subtasks to update (id exists and content changed)
        subtaskDeltas.updated = subtasks.filter(newSt => {
          if (!newSt.id) return false;
          const oldSt = currentSubtasks.find(st => st._id === newSt.id);
          return oldSt && (oldSt.status !== newSt.status || oldSt.label !== newSt.label || oldSt.position !== newSt.position);
        });

        // Remove old subtasks
        for (const subtask of subtaskDeltas.removed) {
          await ctx.db.delete(subtask._id);
        }

        // Add new subtasks
        for (const subtask of subtaskDeltas.added) {
          await ctx.db.insert("subtasks", {
            taskId,
            label: subtask.label,
            status: subtask.status,
            position: subtask.position,
            createdAt: Date.now(),
            createdBy: user._id,
            ...(subtask.status === "completed" ? {
              completedAt: Date.now(),
              completedBy: user._id
            } : {})
          });
        }

        // Update existing subtasks
        for (const subtask of subtaskDeltas.updated) {
          if (!subtask.id) continue;
          const oldSubtask = currentSubtasks.find(st => st._id === subtask.id);

          await ctx.db.patch(subtask.id, {
            label: subtask.label,
            status: subtask.status,
            position: subtask.position,
            ...(subtask.status === "completed" && oldSubtask?.status !== "completed" ? {
              completedAt: Date.now(),
              completedBy: user._id
            } : {}),
            ...(subtask.status !== "completed" && oldSubtask?.status === "completed" ? {
              completedAt: undefined,
              completedBy: undefined
            } : {})
          });
        }
      }
    } else if (updatedSubtaskId) {
      // Single subtask update (assignee use case - toggle completion)
      const subtaskToUpdate = currentSubtasks.find(st => st._id === updatedSubtaskId);
      if (!subtaskToUpdate) {
        throw new Error("Subtask not found");
      }

      // Toggle completion status
      const newStatus = subtaskToUpdate.status === "completed" ? "todo" : "completed";

      await ctx.db.patch(updatedSubtaskId, {
        status: newStatus,
        ...(newStatus === "completed" ? {
          completedAt: Date.now(),
          completedBy: user._id
        } : {
          completedAt: undefined,
          completedBy: undefined
        })
      });

      subtaskDeltas.updated = [{
        id: updatedSubtaskId,
        oldStatus: subtaskToUpdate.status,
        newStatus: newStatus
      }];
    }

    // Get updated subtasks for progress calculation
    const updatedSubtasks = await ctx.db
      .query("subtasks")
      .withIndex("taskId", (q) => q.eq("taskId", taskId))
      .collect();

    // Calculate new progress based on subtasks
    const completedSubtasks = updatedSubtasks.filter(st => st.status === "completed").length;
    const progress = updatedSubtasks.length > 0
      ? Math.round((completedSubtasks / updatedSubtasks.length) * 100)
      : 0;

    // Prepare update object
    const updateObj: any = {
      ...updates,
      ...(isSubtasksChanged || updatedSubtaskId ? { progress } : {})
    };

    // Automatically update task status based on subtask completion
    if (isSubtasksChanged || updatedSubtaskId) {
      if (completedSubtasks === updatedSubtasks.length && updatedSubtasks.length > 0) {
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
            subtaskLabel: added.label,
            status: added.status,
            position: added.position
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
            subtaskId: removed._id,
            subtaskLabel: removed.label
          }
        });
      }

      // Log updated subtasks
      for (const updated of subtaskDeltas.updated) {
        const subtask = updatedSubtasks.find(st => st._id === updated.id);
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
            subtaskId: subtask._id,
            subtaskLabel: subtask.label,
            ...(updated.oldStatus !== undefined ? {
              oldStatus: updated.oldStatus,
              newStatus: updated.newStatus
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
          subtasksCount: updatedSubtasks.length
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

    // Get all subtasks for this task from the separate table
    const subtasks = await ctx.db
      .query("subtasks")
      .withIndex("taskId", (q) => q.eq("taskId", taskId))
      .collect();

    // Log subtask deletion activities first
    if (subtasks && subtasks.length > 0) {
      for (const subtask of subtasks) {
        await createActivityForUser(ctx, {
          userId: user._id,
          actionType: "Subtask Deleted",
          targetId: taskId,
          targetType: "task",
          description: `Subtask "${subtask.label}" deleted from task "${task.name}"`,
          metadata: {
            taskId,
            projectId: task.projectId,
            subtaskId: subtask._id,
            subtaskLabel: subtask.label,
            deletedBy: user._id
          }
        });
      }
    }

    // Delete all subtasks first (cascade delete)
    for (const subtask of subtasks) {
      await ctx.db.delete(subtask._id);
    }

    // Delete task
    await ctx.db.delete(taskId);

    // Log deletion activity
    await createActivityForUser(ctx, {
      userId: user._id,
      actionType: "Deleted Task",
      targetId: taskId,
      targetType: "task",
      description: `Deleted task "${task.name}" with ${subtasks.length} subtasks from project "${project.name}"`,
      metadata: {
        taskId,
        projectId: task.projectId,
        taskName: task.name,
        projectName: project.name,
        subtasksCount: subtasks.length
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
          subtasksCount: subtasks.length
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
            id: v.optional(v.string()), // Optional for new subtasks
            label: v.string(),
            status: v.union(
              v.literal("todo"),
              v.literal("in_progress"),
              v.literal("completed"),
              v.literal("on_hold"),
              v.literal("canceled")
            ),
            position: v.number(),
            // For updates, we might need to track if it's new or existing
            _isNew: v.optional(v.boolean()),
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

      // Get existing subtasks from the database
      const existingSubtasks = await ctx.db
        .query("subtasks")
        .withIndex("taskId", (q) => q.eq("taskId", taskId))
        .collect();

      // Track previous values for logs
      const oldStatus = task.status;
      const oldPriority = task.priority;
      const oldAssigneeId = task.assigneeId;

      // Determine what changed
      const isStatusChanged = updates.status && updates.status !== oldStatus;
      const isPriorityChanged = updates.priority && updates.priority !== oldPriority;
      const isDueDateChanged = updates.dueDate && updates.dueDate !== task.dueDate;
      const isAssigneeChanged = updates.assigneeId && updates.assigneeId !== oldAssigneeId;
      const isSubtasksChanged = updates.subtasks !== undefined;

      // Handle subtask updates if provided
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

        // Create maps for easier comparison
        const existingSubtaskMap = new Map(existingSubtasks.map(st => [st._id.toString(), st]));
        const updatedSubtaskMap = new Map();

        // Process each subtask in the update
        for (const updatedSubtask of updates.subtasks) {
          if (updatedSubtask.id && !updatedSubtask._isNew) {
            // Existing subtask - check for updates
            const existingSubtask = existingSubtaskMap.get(updatedSubtask.id);
            if (existingSubtask) {
              updatedSubtaskMap.set(updatedSubtask.id, updatedSubtask);

              // Check if anything changed
              const hasChanges =
                existingSubtask.label !== updatedSubtask.label ||
                existingSubtask.status !== updatedSubtask.status ||
                existingSubtask.position !== updatedSubtask.position;

              if (hasChanges) {
                subtaskDeltas.updated.push({
                  id: updatedSubtask.id,
                  old: existingSubtask,
                  new: updatedSubtask
                });

                // Update the subtask in database
                const updateObj: any = {
                  label: updatedSubtask.label,
                  status: updatedSubtask.status,
                  position: updatedSubtask.position,
                };

                // Handle completion status changes
                if (updatedSubtask.status === "completed" && existingSubtask.status !== "completed") {
                  updateObj.completedAt = Date.now();
                  updateObj.completedBy = user._id;
                } else if (existingSubtask.status === "completed" && updatedSubtask.status !== "completed") {
                  updateObj.completedAt = undefined;
                  updateObj.completedBy = undefined;
                }

                await ctx.db.patch(existingSubtask._id, updateObj);
              }
            }
          } else {
            // New subtask
            subtaskDeltas.added.push(updatedSubtask);

            const newSubtask = await ctx.db.insert("subtasks", {
              taskId,
              label: updatedSubtask.label,
              status: updatedSubtask.status,
              position: updatedSubtask.position,
              createdAt: Date.now(),
              createdBy: user._id,
              ...(updatedSubtask.status === "completed" ? {
                completedAt: Date.now(),
                completedBy: user._id
              } : {})
            });

            updatedSubtaskMap.set(newSubtask.toString(), updatedSubtask);
          }
        }

        // Find removed subtasks
        for (const existingSubtask of existingSubtasks) {
          if (!updatedSubtaskMap.has(existingSubtask._id.toString())) {
            subtaskDeltas.removed.push(existingSubtask);
            await ctx.db.delete(existingSubtask._id);
          }
        }
      }

      // Calculate new progress based on current subtasks
      let progress = task.progress || 0;
      if (isSubtasksChanged) {
        const currentSubtasks = await ctx.db
          .query("subtasks")
          .withIndex("taskId", (q) => q.eq("taskId", taskId))
          .collect();

        if (currentSubtasks.length > 0) {
          const completedSubtasks = currentSubtasks.filter(st => st.status === "completed").length;
          progress = Math.round((completedSubtasks / currentSubtasks.length) * 100);
        } else {
          progress = 0;
        }
      }

      // Check if status is changing to/from completed
      const isCompletingTask = updates.status === "completed" && task.status !== "completed";
      const isUncompletingTask = task.status === "completed" && updates.status && updates.status !== "completed";

      // Prepare the update object
      const updateObj: any = { ...updates };
      delete updateObj.subtasks; // Remove subtasks from task update since they're handled separately

      if (isSubtasksChanged) {
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
              subtaskLabel: added.label,
              status: added.status
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
              subtaskLabel: removed.label
            }
          });
        }

        // Log updated subtasks
        for (const updated of subtaskDeltas.updated) {
          await createActivityForUser(ctx, {
            userId: user._id,
            actionType: "Updated Subtask",
            targetId: taskId,
            targetType: "task",
            description: `Updated subtask "${updated.new.label}" in task "${task.name}"`,
            metadata: {
              taskId,
              projectId: task.projectId,
              subtaskLabel: updated.new.label,
              oldStatus: updated.old.status,
              newStatus: updated.new.status
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
        // Get current subtask count
        const subtaskCount = await ctx.db
          .query("subtasks")
          .withIndex("taskId", (q) => q.eq("taskId", taskId))
          .collect()
          .then(subtasks => subtasks.length);

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
            subtasksCount: subtaskCount
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

// Bulk delete tasks (updated to handle separate subtasks table)
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

      // Get all subtasks for this task
      const subtasks = await ctx.db
        .query("subtasks")
        .withIndex("taskId", (q) => q.eq("taskId", taskId))
        .collect();

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
      for (const subtask of subtasks) {
        await createActivityForUser(ctx, {
          userId: user._id,
          actionType: "Subtask Deleted",
          targetId: taskId,
          targetType: "task",
          description: `Subtask "${subtask.label}" deleted from task "${task.name}"`,
          metadata: {
            taskId,
            projectId: task.projectId,
            subtaskId: subtask._id.toString(),
            subtaskLabel: subtask.label,
            deletedBy: user._id
          }
        });

        // Delete the subtask
        await ctx.db.delete(subtask._id);
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
        description: `Deleted task "${task.name}" with ${subtasks.length} subtasks from project "${project.name}"`,
        metadata: {
          taskId,
          projectId: task.projectId,
          taskName: task.name,
          projectName: project.name,
          deletedBy: user._id,
          status: task.status,
          assigneeId: task.assigneeId,
          subtasksCount: subtasks.length
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
            subtasksCount: subtasks.length
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

    // Get subtasks for activity logging and progress calculation
    const subtasks = await ctx.db
      .query("subtasks")
      .withIndex("taskId", (q) => q.eq("taskId", taskId))
      .collect();

    const subtasksCount = subtasks.length;
    const subtasksCompleted = subtasks.filter(st => st.status === "completed").length;

    // Update task progress based on subtasks completion
    if (subtasksCount > 0) {
      const progress = Math.round((subtasksCompleted / subtasksCount) * 100);
      await ctx.db.patch(taskId, { progress });
    }

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
          subtasksCount,
          subtasksCompleted
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

export const updateSubtaskStatus = mutation({
  args: {
    subtaskId: v.id("subtasks"),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("on_hold"),
      v.literal("canceled")
    ),
  },
  handler: async (ctx, args) => {
    const { subtaskId, status } = args;

    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const subtask = await ctx.db.get(subtaskId);
    if (!subtask) {
      throw new Error("Subtask not found");
    }

    const oldStatus = subtask.status;
    const isCompletingSubtask = status === "completed" && subtask.status !== "completed";
    const isUncompletingSubtask = subtask.status === "completed" && status !== "completed";

    // Update the subtask status
    await ctx.db.patch(subtaskId, {
      status,
      completedAt: status === "completed" ? Date.now() : undefined,
    });

    // Get the parent task
    const parentTask = await ctx.db.get(subtask.taskId);
    if (!parentTask) {
      throw new Error("Parent task not found");
    }

    // Get all subtasks for the parent task to recalculate progress
    const allSubtasks = await ctx.db
      .query("subtasks")
      .withIndex("taskId", (q) => q.eq("taskId", subtask.taskId))
      .collect();

    const subtasksCount = allSubtasks.length;
    const subtasksCompleted = allSubtasks.filter(st =>
      st._id === subtaskId ? status === "completed" : st.status === "completed"
    ).length;

    // Update parent task progress
    if (subtasksCount > 0) {
      const progress = Math.round((subtasksCompleted / subtasksCount) * 100);
      await ctx.db.patch(subtask.taskId, { progress });

      // Auto-complete parent task if all subtasks are completed
      if (subtasksCompleted === subtasksCount && parentTask.status !== "completed") {
        await ctx.db.patch(subtask.taskId, {
          status: "completed",
          completedAt: Date.now(),
          completedBy: userId,
        });

        // Update project stats for task completion
        const project = await ctx.db.get(parentTask.projectId);
        if (project) {
          const newCompletedTasks = (project.completedTasks || 0) + 1;
          await ctx.db.patch(parentTask.projectId, {
            completedTasks: newCompletedTasks,
            progress: project.totalTasks
              ? Math.round(newCompletedTasks / project.totalTasks * 100)
              : 0
          });
        }

        // Create activity log for task auto-completion
        await createActivityForUser(ctx, {
          userId,
          actionType: "Auto-completed Task",
          targetId: subtask.taskId,
          targetType: "task",
          description: `Task "${parentTask.name}" auto-completed when all subtasks were finished`,
          metadata: {
            taskId: subtask.taskId,
            projectId: parentTask.projectId,
            subtasksCount,
            subtasksCompleted,
            triggeredBy: "subtask_completion"
          }
        });
      }
      // Re-open parent task if it was completed but now has incomplete subtasks
      else if (parentTask.status === "completed" && subtasksCompleted < subtasksCount) {
        await ctx.db.patch(subtask.taskId, {
          status: "in_progress",
          completedAt: undefined,
          completedBy: undefined,
        });

        // Update project stats for task re-opening
        const project = await ctx.db.get(parentTask.projectId);
        if (project) {
          const newCompletedTasks = Math.max(0, (project.completedTasks || 0) - 1);
          await ctx.db.patch(parentTask.projectId, {
            completedTasks: newCompletedTasks,
            progress: project.totalTasks
              ? Math.round(newCompletedTasks / project.totalTasks * 100)
              : 0
          });
        }

        // Create activity log for task re-opening
        await createActivityForUser(ctx, {
          userId,
          actionType: "Re-opened Task",
          targetId: subtask.taskId,
          targetType: "task",
          description: `Task "${parentTask.name}" re-opened due to incomplete subtasks`,
          metadata: {
            taskId: subtask.taskId,
            projectId: parentTask.projectId,
            subtasksCount,
            subtasksCompleted,
            triggeredBy: "subtask_status_change"
          }
        });
      }
    }

    // Create activity log for subtask status change
    if (status !== oldStatus) {
      const project = await ctx.db.get(parentTask.projectId);
      await createActivityForUser(ctx, {
        userId,
        actionType: "Updated Subtask Status",
        targetId: subtaskId,
        targetType: "subtask",
        description: `Changed subtask status from ${oldStatus} to ${status}`,
        metadata: {
          subtaskId,
          taskId: subtask.taskId,
          projectId: parentTask.projectId,
          oldStatus,
          newStatus: status,
          taskName: parentTask.name,
          projectName: project?.name || ""
        }
      });
    }

    return { success: true };
  },
});
// Mutation to update subtask position (for reordering within same status)
export const updateSubtaskPosition = mutation({
  args: {
    subtaskId: v.id("subtasks"),
    newPosition: v.number(),
  },
  handler: async (ctx, args) => {
    const { subtaskId, newPosition } = args;

    await ctx.db.patch(subtaskId, {
      position: newPosition,
    });

    return { success: true };
  },
});