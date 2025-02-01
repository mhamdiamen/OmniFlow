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
export const updateRole = mutation({
    args: {
        id: v.id("roles"), // Role ID to update
        name: v.optional(v.string()), // Optional new name
        description: v.optional(v.string()), // Optional new description
        permissions: v.optional(v.array(v.id("permissions"))), // Optional new permissions
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("User not authenticated");

        // Fetch the existing role
        const role = await ctx.db.get(args.id);
        if (!role) throw new Error("Role not found");

        // Validate new permissions (if provided)
        if (args.permissions) {
            for (const permissionId of args.permissions) {
                const permission = await ctx.db.get(permissionId);
                if (!permission) throw new Error(`Permission ID ${permissionId} not found`);
            }
        }

        // Prepare the updated fields
        const updatedFields = {
            name: args.name ?? role.name, // Use existing name if not provided
            description: args.description ?? role.description, // Use existing description if not provided
            permissions: args.permissions ?? role.permissions, // Use existing permissions if not provided
        };

        // Update the role in the database
        await ctx.db.patch(args.id, updatedFields);

        // If permissions were updated, handle assignedRoles for permissions
        if (args.permissions) {
            // Remove the role from the assignedRoles of old permissions
            for (const permissionId of role.permissions) {
                const permission = await ctx.db.get(permissionId);
                if (permission) {
                    const updatedAssignedRoles = permission.assignedRoles.filter(
                        (roleId) => roleId !== args.id
                    );
                    await ctx.db.patch(permissionId, { assignedRoles: updatedAssignedRoles });
                }
            }

            // Add the role to the assignedRoles of new permissions
            for (const permissionId of args.permissions) {
                const permission = await ctx.db.get(permissionId);
                if (permission) {
                    const updatedAssignedRoles = [...(permission.assignedRoles || []), args.id];
                    await ctx.db.patch(permissionId, { assignedRoles: updatedAssignedRoles });
                }
            }
        }

        return args.id; // Return the updated role ID
    },
});
export const bulkRemoveRoles = mutation({
    args: {
        roleIds: v.array(v.id("roles")), // Array of role IDs to delete
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("User not authenticated");

        // Fetch all roles to get their permissions
        const roles = await Promise.all(
            args.roleIds.map(async (roleId) => {
                const role = await ctx.db.get(roleId);
                if (!role) throw new Error(`Role ID ${roleId} not found`);
                return role;
            })
        );

        // Remove the roles from the assignedRoles field of each permission
        for (const role of roles) {
            for (const permissionId of role.permissions) {
                const permission = await ctx.db.get(permissionId);
                if (permission) {
                    const updatedAssignedRoles = permission.assignedRoles.filter(
                        (roleId) => !args.roleIds.includes(roleId)
                    );
                    await ctx.db.patch(permissionId, { assignedRoles: updatedAssignedRoles });
                }
            }
        }

        // Delete the roles
        await Promise.all(args.roleIds.map((roleId) => ctx.db.delete(roleId)));

        return args.roleIds; // Return the deleted role IDs
    },
});