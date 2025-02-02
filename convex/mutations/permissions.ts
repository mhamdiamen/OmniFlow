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
      assignedRoles: [],
      assignedModules: [],
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
export const updatePermission = mutation({
  args: {
    id: v.id("permissions"), // Permission ID to update
    name: v.optional(v.string()), // Optional new name
    description: v.optional(v.string()), // Optional new description
    assignedRoles: v.optional(v.array(v.id("roles"))), // Optional new assigned roles
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    // Fetch the existing permission
    const permission = await ctx.db.get(args.id);
    if (!permission) throw new Error("Permission not found");

    // Prepare the updated fields
    const updatedFields = {
      name: args.name ?? permission.name, // Use existing name if not provided
      description: args.description ?? permission.description, // Use existing description if not provided
      assignedRoles: args.assignedRoles ?? permission.assignedRoles, // Use existing assignedRoles if not provided
    };

    // Update the permission in the database
    await ctx.db.patch(args.id, updatedFields);
  },
});
export const bulkRemovePermissions = mutation({
  args: {
    permissionIds: v.array(v.id("permissions")), // Array of permission IDs to delete
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    // Fetch all permissions to get their assigned roles
    const permissions = await Promise.all(
      args.permissionIds.map(async (permissionId) => {
        const permission = await ctx.db.get(permissionId);
        if (!permission) throw new Error(`Permission ID ${permissionId} not found`);
        return permission;
      })
    );

    // Remove the permissions from the permissions field of each role
    for (const permission of permissions) {
      for (const roleId of permission.assignedRoles || []) {
        const role = await ctx.db.get(roleId);
        if (role) {
          const updatedPermissions = role.permissions.filter(
            (permissionId) => !args.permissionIds.includes(permissionId)
          );
          await ctx.db.patch(roleId, { permissions: updatedPermissions });
        }
      }
    }

    // Delete the permissions
    await Promise.all(args.permissionIds.map((permissionId) => ctx.db.delete(permissionId)));

    return args.permissionIds; // Return the deleted permission IDs
  },
});