import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getActiveSession = query({
  args: { subjectId: v.string() }, // Add subjectId as an argument
  handler: async (ctx, { subjectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Find active session for this specific user AND subjectId
    const session = await ctx.db
      .query("timeSessions")
      .withIndex("by_user_subject_status", (q) =>
        q
          .eq("userId", userId)
          .eq("subjectId", subjectId)
          .eq("status", "active")
      )
      .first();

    return session
      ? {
          sessionId: session._id,
          subjectId: session.subjectId,
          subjectType: session.subjectType,
          startTime: session.startTime,
          lastPing: session.lastPing,
        }
      : null;
  },
});