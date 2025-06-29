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
        targetId: v.optional(v.string()), // Make it optional to maintain backward compatibility
    },
    handler: async (ctx, args) => {
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) throw new Error("User not authenticated");

        let query = ctx.db
            .query("recentActivity")
            .filter((q) => q.eq(q.field("targetType"), args.targetType));

        if (args.targetId) {
            query = query.filter((q) => q.eq(q.field("targetId"), args.targetId));
        }

        return await query
            .order("desc")
            .collect();
    },
});
export const getActivitiesForUserTasks = query({
    args: {
        taskIds: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) throw new Error("User not authenticated");

        const activities = await ctx.db.query("recentActivity").collect();

        // Filter activities that match any of the user's tasks
        const filteredActivities = activities.filter((activity) => {
            if (
                activity.targetType === "task" &&
                activity.targetId !== undefined && args.taskIds.includes(activity.targetId)
            ) {
                return true;
            }
            if (
                activity.targetType === "comment" &&
                activity.metadata?.targetId && // ✅ ensure it's defined
                args.taskIds.includes(activity.metadata.targetId)
            ) {
                return true;
            }
            return false;
        });


        // Sort by creation time descending
        return filteredActivities.sort((a, b) => b._creationTime - a._creationTime);
    },
});

