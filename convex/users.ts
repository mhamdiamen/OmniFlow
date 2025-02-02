import { getAuthSessionId, getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { Id } from "./_generated/dataModel";


export const CurrentUser = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        // Fetch the user record.
        const user = await ctx.db.get(userId);
        if (!user) return null;

        // Default role name if no role is found.
        let roleName = "Guest";

        // Check if user.roleId exists and cast it to Id<"roles">.
        if (user.roleId) {
            const role = await ctx.db.get(user.roleId as Id<"roles">);
            // Check that the role has a "name" property.
            if (role && "name" in role) {
                roleName = role.name;
            }
        }

        // Return the user object with the added role field.
        return {
            ...user,
            role: roleName,
        };
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
