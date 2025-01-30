import { getAuthSessionId, getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const CurrentUser = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        return userId !== null ? ctx.db.get(userId) : null;
    },
});
export const currentSession = query({
    args: {},
    handler: async (ctx) => {
        const sessionId = await getAuthSessionId(ctx);
        if (sessionId === null) {
            return null;
        }
        return await ctx.db.get(sessionId);
    },
});
// Query: Get user details by ID
export const getUserById = query({
    args: { id: v.id("users") },
    handler: async ({ db }, { id }) => {
        const user = await db.get(id);
        if (!user) {
            throw new ConvexError("User not found.");
        }
        return user;
    },
});
