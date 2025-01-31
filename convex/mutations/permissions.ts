import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createPermission = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("User not authenticated");

        // Create the permission with an empty assignedRoles array
        await ctx.db.insert("permissions", {
            name: args.name,
            description: args.description,
            assignedRoles: [], // Initialize as an empty array
        });
    },
});
export const removePermissionById = mutation({
    args: {
        id: v.id("permissions"), // Permission ID to delete
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("User not authenticated");

        // Delete the permission
        await ctx.db.delete(args.id);
    },
});
