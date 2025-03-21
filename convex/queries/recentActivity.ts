import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getActivitiesByUser = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) throw new Error("User not authenticated");

        return await ctx.db
            .query("recentActivity")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();
    },
});

export const getActivitiesByActionType = query({
    args: {
        actionType: v.string(),
    },
    handler: async (ctx, args) => {
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) throw new Error("User not authenticated");

        return await ctx.db
            .query("recentActivity")
            .withIndex("actionType", (q) => q.eq("actionType", args.actionType))
            .order("desc")
            .collect();
    },
});

export const getActivitiesByCompany = query({
    args: {
        companyId: v.string(),
    },
    handler: async (ctx, args) => {
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) throw new Error("User not authenticated");

        const users = await ctx.db
            .query("users")
            .withIndex("companyId", (q) => q.eq("companyId", args.companyId))
            .collect();

        const userIds = users.map((user) => user._id);

        if (userIds.length === 0) {
            return [];
        }

        return await ctx.db
            .query("recentActivity")
            .filter((q) =>
                q.or(...userIds.map((userId) => q.eq(q.field("userId"), userId)))
            )
            .order("desc")
            .collect();
    },
});

export const getActivitiesByTargetType = query({
    args: {
        targetType: v.string(),
    },
    handler: async (ctx, args) => {
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) throw new Error("User not authenticated");

        return await ctx.db
            .query("recentActivity")
            .filter((q) => q.eq(q.field("targetType"), args.targetType))
            .order("desc")
            .collect();
    },
});