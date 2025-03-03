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
        startDate: v.float64(),
        endDate: v.optional(v.float64()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("User not authenticated");

        const projectId = await ctx.db.insert("projects", {
            ...args,
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
