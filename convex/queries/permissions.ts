// src/server/permissions.js
import { v } from "convex/values";
import { query } from "../_generated/server";

export const fetchAllPermissions = query(async (ctx) => {
    const permissions = await ctx.db.query("permissions").collect();

    return await Promise.all(
        permissions.map(async (permission) => {
            const roles = await Promise.all(
                (permission.assignedRoles || []).map((roleId) => ctx.db.get(roleId))
            );

            return {
                ...permission,
                assignedRoles: roles
                    .filter((role) => role !== null) // Filter out nulls (in case a role was deleted)
                    .map((role) => role.name), // Extract role names
            };
        })
    );
});

export const fetchPermissionsByIds = query({
    args: { ids: v.array(v.id("permissions")) }, // Array of permission IDs
    handler: async (ctx, args) => {
        const permissions = await Promise.all(
            args.ids.map((id) => ctx.db.get(id))
        );
        return permissions.filter((permission) => permission !== null); // Filter out nulls
    },
});
