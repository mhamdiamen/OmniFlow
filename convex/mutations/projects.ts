import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export const createProject = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        companyId: v.id("companies"),
        teamId: v.optional(v.id("teams")),
        projectId: v.optional(v.id("projects")), // For sub-projects
        status: v.union(
            v.literal("planned"),
            v.literal("in_progress"),
            v.literal("completed"),
            v.literal("on_hold"),
            v.literal("canceled")
        ),
        // New fields for categorization
        tags: v.optional(v.array(v.string())),
        category: v.optional(v.string()),
        
        // New fields for project health and priority
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
        if (!userId) throw new Error("User not authenticated");

        const projectId = await ctx.db.insert("projects", {
            ...args,
            // Initialize progress tracking fields
            progress: 0,
            totalTasks: 0,
            completedTasks: 0,
            createdBy: userId,
        });

        return { projectId };
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
        // New fields for categorization
        tags: v.optional(v.array(v.string())),
        category: v.optional(v.string()),
        
        // New fields for project health and priority
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
        // Progress can be manually updated if needed
        progress: v.optional(v.number()),
        startDate: v.float64(),
        endDate: v.optional(v.float64()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("User not authenticated");

        await ctx.db.patch(args.projectId, {
            ...args,
            updatedBy: userId,
            updatedAt: Date.now(),
        });
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

        const project = await ctx.db.get(projectId);
        if (!project) throw new Error("Project not found");

        await ctx.db.delete(projectId);

        return { success: true };
    },
});

// Add this mutation to your projects.ts file

export const bulkDeleteProjects = mutation({
  args: {
    projectIds: v.array(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const { projectIds } = args;
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");
    
    const results = {
      success: true,
      deletedCount: 0,
      errors: [] as { projectId: Id<"projects">, error: string }[],
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
            error: "Project not found"
          });
          continue;
        }
        
        // Delete the project
        await ctx.db.delete(projectId);
        results.deletedCount++;
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
