import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { createActivityForUser } from "./recentActivity";

// Create a new task
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
  },
  handler: async (ctx, args) => {
    const { projectId, name, description, assigneeId, status, priority, dueDate } = args;

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

    // Create the task
    const taskId = await ctx.db.insert("tasks", {
      projectId,
      name,
      description,
      assigneeId,
      status,
      priority,
      dueDate,
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
      description: `Task "${name}" created in project "${project.name}"`,
      metadata: {
        taskId,
        projectId,
        status,
        priority,
        createdBy: user._id
      }
    });

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
          projectName: project.name
        }
      });
    }

    return taskId;
  },
});

// Update an existing task
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
  },
  handler: async (ctx, args) => {
    const { taskId, ...updates } = args;

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

    // Determine if status/priority/due date changed
    const isStatusChanged = updates.status && updates.status !== oldStatus;
    const isPriorityChanged = updates.priority && updates.priority !== oldPriority;
    const isDueDateChanged = updates.dueDate && updates.dueDate !== task.dueDate;
    const isAssigneeChanged = updates.assigneeId && updates.assigneeId !== oldAssigneeId;

    // Prepare update object
    const updateObj: any = { ...updates };

    // Handle task completion logic
    const isCompletingTask = updates.status === "completed" && task.status !== "completed";
    const isUncompletingTask = task.status === "completed" && updates.status && updates.status !== "completed";

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
        projectName: project.name
      }
    });

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
          projectName: project.name
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

// Delete a task
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

    // Delete task
    await ctx.db.delete(taskId);

    // Log deletion activity
    await createActivityForUser(ctx, {
      userId: user._id,
      actionType: "Deleted Task",
      targetId: taskId,
      targetType: "task",
      description: `Deleted task "${task.name}" from project "${project.name}"`,
      metadata: {
        taskId,
        projectId: task.projectId,
        taskName: task.name,
        projectName: project.name
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
          projectName: project.name
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

// Bulk update tasks
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

      // Determine what changed
      const isStatusChanged = updates.status && updates.status !== oldStatus;
      const isPriorityChanged = updates.priority && updates.priority !== oldPriority;
      const isDueDateChanged = updates.dueDate && updates.dueDate !== task.dueDate;
      const isAssigneeChanged = updates.assigneeId && updates.assigneeId !== oldAssigneeId;

      // Check if status is changing to/from completed
      const isCompletingTask = updates.status === "completed" && task.status !== "completed";
      const isUncompletingTask = task.status === "completed" && updates.status && updates.status !== "completed";

      // Prepare the update object
      const updateObj: any = { ...updates };

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
          projectName: project.name
        }
      });

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
            projectName: project.name
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

    for (const taskId of taskIds) {
      // Get the task
      const task = await ctx.db.get(taskId);
      if (!task) continue;

      // Fetch project
      const project = await ctx.db.get(task.projectId);
      if (!project) continue;

      // Save old assignee ID before deletion
      const oldAssigneeId = task.assigneeId;

      // Delete the task
      await ctx.db.delete(taskId);
      deletedCount++;

      // Update project task counts
      if (project) {
        await ctx.db.patch(task.projectId, {
          totalTasks: Math.max(0, (project.totalTasks || 0) - 1),
          ...(task.status === "completed" ? {
            completedTasks: Math.max(0, (project.completedTasks || 0) - 1)
          } : {}),
          progress: (project.totalTasks || 0) > 1
            ? Math.round(
              ((project.completedTasks || 0) - (task.status === "completed" ? 1 : 0)) /
              ((project.totalTasks || 0) - 1) * 100
            )
            : 0
        });
      }

      // Log activity for the deleting user
      await createActivityForUser(ctx, {
        userId: user._id,
        actionType: "Deleted Task",
        targetId: taskId,
        targetType: "task",
        description: `Deleted task "${task.name}" from project "${project.name}"`,
        metadata: {
          taskId,
          projectId: task.projectId,
          taskName: task.name,
          projectName: project.name,
          deletedBy: user._id,
          status: task.status,
          assigneeId: task.assigneeId
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
            taskName: task.name
          }
        });
      }
    }

    return { success: true, deletedCount };
  },
});
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
          projectName: project?.name || ""
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
