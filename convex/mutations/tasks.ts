import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

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

    // Get the current user using getAuthUserId instead of getUserIdentity
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Find the user in the database
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify the project exists
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
    // In createTask mutation, update the project task counts section:
    if (project.totalTasks !== undefined) {
        const newTotalTasks = (project.totalTasks || 0) + 1;
        await ctx.db.patch(projectId, {
            totalTasks: newTotalTasks,
            ...(status === "completed" ? {
                completedTasks: (project.completedTasks || 0) + 1
            } : {}),
            // Update progress percentage
            progress: newTotalTasks > 0 
                ? Math.round(
                    ((project.completedTasks || 0) + (status === "completed" ? 1 : 0)) / 
                    newTotalTasks * 100
                )
                : 0
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

    // Get the current task
    const task = await ctx.db.get(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    // Check if status is changing to completed
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

    // Update project task counts if status changed to/from completed
    // In updateTask mutation, update the project update section:
    if (isCompletingTask || isUncompletingTask) {
        const project = await ctx.db.get(task.projectId);
        if (project) {
            const newCompletedTasks = Math.max(
                0,
                (project.completedTasks || 0) + (isCompletingTask ? 1 : -1)
            );
            await ctx.db.patch(task.projectId, {
                completedTasks: newCompletedTasks,
                // Update progress percentage
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
    
    // Get the current user using getAuthUserId
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the task
    const task = await ctx.db.get(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    // Delete the task
    await ctx.db.delete(taskId);

    // Update project task counts
    // In deleteTask mutation, update the project update section:
    const project = await ctx.db.get(task.projectId);
    if (project) {
        const newTotalTasks = Math.max(0, (project.totalTasks || 0) - 1);
        const newCompletedTasks = Math.max(
            0,
            (project.completedTasks || 0) - (task.status === "completed" ? 1 : 0)
        );
        await ctx.db.patch(task.projectId, {
            totalTasks: newTotalTasks,
            completedTasks: newCompletedTasks,
            // Update progress percentage
            progress: newTotalTasks > 0
                ? Math.round(newCompletedTasks / newTotalTasks * 100)
                : 0
        });
    }

    return { success: true };
  },
});

// Bulk update tasks (e.g., change assignee for multiple tasks)
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

// Add this mutation to handle bulk deletion of tasks
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

    // Track the number of tasks deleted
    let deletedCount = 0;

    for (const taskId of taskIds) {
      // Get the task
      const task = await ctx.db.get(taskId);
      if (!task) continue;

      // Delete the task
      await ctx.db.delete(taskId);
      deletedCount++;

      // Update project task counts
      const project = await ctx.db.get(task.projectId);
      if (project) {
        await ctx.db.patch(task.projectId, {
          totalTasks: Math.max(0, (project.totalTasks || 0) - 1),
          ...(task.status === "completed" ? {
            completedTasks: Math.max(0, (project.completedTasks || 0) - 1)
          } : {}),
          // Update progress percentage
          progress: (project.totalTasks || 0) > 1
            ? Math.round(
              (project.completedTasks || 0) - (task.status === "completed" ? 1 : 0) /
              ((project.totalTasks || 0) - 1) * 100
            )
            : 0
        });
      }
    }

    return { success: true, deletedCount };
  },
});