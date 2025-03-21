import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export const createActivity = mutation({
  args: {
    actionType: v.string(),
    targetId: v.optional(v.string()),
    targetType: v.optional(v.string()),
    description: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    // Create the activity record
    const activityId = await ctx.db.insert("recentActivity", {
      userId: userId as Id<"users">,
      actionType: args.actionType,
      targetId: args.targetId,
      targetType: args.targetType,
      description: args.description,
      metadata: args.metadata,
    });

    return { activityId };
  },
});

export const createActivityForUser = mutation({
  args: {
    userId: v.id("users"),
    actionType: v.string(),
    targetId: v.optional(v.string()),
    targetType: v.optional(v.string()),
    description: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Verify the user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Create the activity record
    const activityId = await ctx.db.insert("recentActivity", {
      userId: args.userId,
      actionType: args.actionType,
      targetId: args.targetId,
      targetType: args.targetType,
      description: args.description,
      metadata: args.metadata,
    });
    
    return { activityId };
  },
});

export const deleteActivity = mutation({
  args: {
    activityId: v.id("recentActivity"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    // Get the activity to verify ownership
    const activity = await ctx.db.get(args.activityId);
    if (!activity) {
      throw new Error("Activity not found");
    }

    // Only allow users to delete their own activities
    if (activity.userId !== userId) {
      throw new Error("Not authorized to delete this activity");
    }

    // Delete the activity
    await ctx.db.delete(args.activityId);

    return { success: true };
  },
});