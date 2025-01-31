import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { v } from "convex/values";

export const createRole = mutation({
    args: {
        companyId: v.optional(v.string()),
        name: v.string(),
        description: v.optional(v.string()),
        permissions: v.array(v.id("permissions")), // Array of permission IDs
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("User not authenticated");

        // Validate permissions exist
        for (const permissionId of args.permissions) {
            const permission = await ctx.db.get(permissionId);
            if (!permission) throw new Error(`Permission ID ${permissionId} not found`);
        }

        // Create the role
        const roleId = await ctx.db.insert("roles", {
            companyId: args.companyId,
            name: args.name,
            description: args.description,
            permissions: args.permissions,
        });

        // Update the assignedRoles field for each permission
        for (const permissionId of args.permissions) {
            const permission = await ctx.db.get(permissionId);
            if (permission) {
                const updatedAssignedRoles = [...(permission.assignedRoles || []), roleId];
                await ctx.db.patch(permissionId, { assignedRoles: updatedAssignedRoles });
            }
        }

        return roleId;
    },
});

export const removeRoleById = mutation({
    args: {
        id: v.id("roles"), // Role ID to delete
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("User not authenticated");

        // Fetch the role to get its permissions
        const role = await ctx.db.get(args.id);
        if (!role) throw new Error("Role not found");

        // Remove the role from the assignedRoles field of each permission
        for (const permissionId of role.permissions) {
            const permission = await ctx.db.get(permissionId);
            if (permission) {
                const updatedAssignedRoles = permission.assignedRoles.filter(
                    (roleId) => roleId !== args.id
                );
                await ctx.db.patch(permissionId, { assignedRoles: updatedAssignedRoles });
            }
        }

        // Delete the role
        await ctx.db.delete(args.id);
    },
});