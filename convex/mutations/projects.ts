import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { createActivityForUser } from "./recentActivity";
import { startCase } from "lodash";
export const createProject = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    companyId: v.id("companies"),
    teamId: v.optional(v.id("teams")),
    parentId: v.optional(v.id("projects")), // For sub-projects
    status: v.union(
      v.literal("planned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("on_hold"),
      v.literal("canceled")
    ),
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    healthStatus: v.optional(v.union(
      v.literal("on_track"),
      v.literal("at_risk"),
      v.literal("off_track")
    )),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    )),
    startDate: v.float64(),
    endDate: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const { name, description, companyId, teamId, parentId, status, category, priority } = args;

    // Fetch creator user data
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Insert the new project into the database
    const newProjectId = await ctx.db.insert("projects", {
      ...args,
      progress: 0,
      totalTasks: 0,
      completedTasks: 0,
      createdBy: userId,
    });

    // 🔔 Log creation activity

    // Log activity for the user who created the project
    await createActivityForUser(ctx, {
      userId: user._id,
      actionType: "Created Project",
      targetId: newProjectId,
      targetType: "project",
      description: `Project "${name}" was successfully created by ${user.name}`,
      metadata: {
        projectId: newProjectId,
        projectName: name,
        companyId,
        status,
        ...(teamId ? { teamId } : {}),
        ...(parentId ? { parentId } : {}),
        ...(category ? { category } : {}),
        ...(priority ? { priority } : {}),
        createdBy: user._id,
        createdAt: Date.now(),
      }
    });

    return {
      projectId: newProjectId,
      message: "Project successfully created.",
    };
  },
});

export const updateProject = mutation({
  args: {
      projectId: v.id("projects"),
      name: v.string(),
      description: v.optional(v.string()),
      teamId: v.optional(v.id("teams")),
      status: v.union(
          v.literal("planned"),
          v.literal("in_progress"),
          v.literal("completed"),
          v.literal("on_hold"),
          v.literal("canceled")
      ),
      tags: v.optional(v.array(v.string())),
      category: v.optional(v.string()),
      healthStatus: v.optional(v.union(
          v.literal("on_track"),
          v.literal("at_risk"),
          v.literal("off_track")
      )),
      priority: v.optional(v.union(
          v.literal("low"),
          v.literal("medium"),
          v.literal("high"),
          v.literal("critical")
      )),
      progress: v.optional(v.number()),
      startDate: v.float64(),
      endDate: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("User not authenticated");

      // Get current user
      const user = await ctx.db.get(userId);
      if (!user) {
          throw new Error("User not found");
      }

      // Get current project data before update
      const project = await ctx.db.get(args.projectId);
      if (!project) {
          throw new Error("Project not found");
      }

      // Track if project status is changing
      const statusChanged = args.status !== project.status;
      const isCompletingProject = args.status === "completed" && project.status !== "completed";

      // Update the project
      await ctx.db.patch(args.projectId, {
          ...args,
          updatedBy: userId,
          updatedAt: Date.now(),
          ...(isCompletingProject && { completedAt: Date.now() }),
      });

      // Create general project update log
      await createActivityForUser(ctx, {
          userId: user._id,
          actionType: "Project Updated",
          targetId: args.projectId,
          targetType: "project",
          description: `Project "${args.name}" was updated`,
          metadata: {
              updatedBy: user._id,
              projectId: args.projectId,
              projectName: args.name,
              statusChanged: statusChanged,
              oldStatus: statusChanged ? project.status : undefined,
              newStatus: statusChanged ? args.status : undefined,
              wasCompleted: isCompletingProject
          }
      });

      return args.projectId;
  },
});

// New mutation to update project progress based on task completion
export const updateProjectProgress = mutation({
    args: {
        projectId: v.id("projects"),
        completedTasks: v.number(),
        totalTasks: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("User not authenticated");

        const { projectId, completedTasks, totalTasks } = args;
        
        // Calculate progress percentage
        const progress = totalTasks > 0 
            ? Math.round((completedTasks / totalTasks) * 100) 
            : 0;
        
        await ctx.db.patch(projectId, {
            completedTasks,
            totalTasks,
            progress,
            updatedBy: userId,
            updatedAt: Date.now(),
        });
        
        return { progress };
    },
});

export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");

    // Delete the project
    await ctx.db.delete(projectId);

    // 🔔 Log deletion activity
    await createActivityForUser(ctx, {
      userId: user._id,
      actionType: "Project Deleted",
      targetId: projectId,
      targetType: "project",
      description: `Project "${project.name}" was deleted`,
      metadata: {
        projectId,
        projectName: project.name,
        deletedBy: user._id,
        deletedAt: Date.now(),
        status: project.status,
        ...(project.teamId ? { teamId: project.teamId } : {}),
        ...(project.category ? { category: project.category } : {})
      }
    });

    return { success: true };
  },
});
export const bulkDeleteProjects = mutation({
  args: {
    projectIds: v.array(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const { projectIds } = args;
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    // Get current user
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const results = {
      success: true,
      deletedCount: 0,
      errors: [] as { projectId: Id<"projects">; error: string }[],
      message: ""
    };

    // Delete each project
    for (const projectId of projectIds) {
      try {
        // Check if project exists
        const project = await ctx.db.get(projectId);
        if (!project) {
          results.errors.push({
            projectId,
            error: "Project not found",
          });
          continue;
        }

        // Delete the project
        await ctx.db.delete(projectId);
        results.deletedCount++;

        // 🔔 Log deletion activity
        await createActivityForUser(ctx, {
          userId: user._id,
          actionType: "Project Deleted",
          targetId: projectId,
          targetType: "project",
          description: `Project "${project.name}" was deleted in bulk`,
          metadata: {
            projectId,
            projectName: project.name,
            deletedBy: user._id,
            deletedAt: Date.now(),
            status: project.status,
            ...(project.teamId ? { teamId: project.teamId } : {}),
            ...(project.category ? { category: project.category } : {})
          }
        });
      } catch (error) {
        results.errors.push({
          projectId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    if (results.errors.length > 0 && results.deletedCount === 0) {
      results.success = false;
      results.message = "Failed to delete any projects";
    } else if (results.errors.length > 0) {
      results.message = `Successfully deleted ${results.deletedCount} projects, but encountered errors with ${results.errors.length} projects`;
    } else {
      results.message = `Successfully deleted ${results.deletedCount} projects`;
    }

    return results;
  },
});
export const bulkUpdateProjects = mutation({
  args: {
    projectIds: v.array(v.id("projects")),
    updates: v.object({
      status: v.optional(v.union(
        v.literal("planned"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("on_hold"),
        v.literal("canceled")
      )),
      priority: v.optional(v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      )),
      healthStatus: v.optional(v.union(
        v.literal("on_track"),
        v.literal("at_risk"),
        v.literal("off_track")
      )),
      category: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const { projectIds, updates } = args;
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    // Get current user
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const results = {
      success: true,
      updatedCount: 0,
      errors: [] as { projectId: Id<"projects">; error: string }[],
      message: ""
    };

    // Update each project
    for (const projectId of projectIds) {
      try {
        // Check if project exists
        const project = await ctx.db.get(projectId);
        if (!project) {
          results.errors.push({
            projectId,
            error: "Project not found",
          });
          continue;
        }

        // Track previous values
        const oldStatus = project.status;
        const oldPriority = project.priority;
        const oldHealthStatus = project.healthStatus;
        const oldCategory = project.category;
        const oldTags = project.tags;

        // Build changes description
        const changes: string[] = [];

        if (updates.status && updates.status !== oldStatus) {
          changes.push(`status from "${startCase(oldStatus)}" to "${startCase(updates.status)}"`);
        }
        if (updates.priority && updates.priority !== oldPriority) {
          changes.push(`priority from "${startCase(oldPriority)}" to "${startCase(updates.priority)}"`);
        }
        if (updates.healthStatus && updates.healthStatus !== oldHealthStatus) {
          changes.push(`health status from "${startCase(oldHealthStatus)}" to "${startCase(updates.healthStatus)}"`);
        }
        if (updates.category !== undefined && updates.category !== oldCategory) {
          changes.push(`category from "${oldCategory}" to "${updates.category}"`);
        }
        if (updates.tags !== undefined) {
          changes.push("tags");
        }

        // Apply patch
        await ctx.db.patch(projectId, {
          ...updates,
          updatedBy: userId,
          updatedAt: Date.now(),
        });

        results.updatedCount++;

        // 🔔 Log activity
        await createActivityForUser(ctx, {
          userId: user._id,
          actionType: "Project Updated",
          targetId: projectId,
          targetType: "project",
          description: `Project "${project.name}" was updated: ${changes.join("; ")}`,
          metadata: {
            projectId,
            projectName: project.name,
            updatedBy: user._id,
            updatedAt: Date.now(),
            updatedFields: Object.keys(updates),
            ...(updates.status ? { 
              oldStatus: startCase(oldStatus), 
              newStatus: startCase(updates.status) 
            } : {}),
            ...(updates.priority ? { 
              oldPriority: startCase(oldPriority), 
              newPriority: startCase(updates.priority) 
            } : {}),
            ...(updates.healthStatus ? { 
              oldHealthStatus: startCase(oldHealthStatus), 
              newHealthStatus: startCase(updates.healthStatus) 
            } : {}),
            ...(updates.category ? { oldCategory, newCategory: updates.category } : {}),
            ...(updates.tags ? { oldTags, newTags: updates.tags } : {})
          }
        });
      } catch (error) {
        results.errors.push({
          projectId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    if (results.errors.length > 0 && results.updatedCount === 0) {
      results.success = false;
      results.message = "Failed to update any projects";
    } else if (results.errors.length > 0) {
      results.message = `Successfully updated ${results.updatedCount} projects, but encountered errors with ${results.errors.length} projects`;
    } else {
      results.message = `Successfully updated ${results.updatedCount} projects`;
    }

    return results;
  },
});