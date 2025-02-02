// src/server/permissions.js
import { v } from "convex/values";
import { query } from "../_generated/server";

export const fetchAllPermissions = query(async (ctx) => {
    const permissions = await ctx.db.query("permissions").collect();
  
    return await Promise.all(
      permissions.map(async (permission) => {
        // Resolve assigned roles to role names.
        const roles = await Promise.all(
          (permission.assignedRoles || []).map((roleId) => ctx.db.get(roleId))
        );
  
        // Resolve assigned modules to module names.
        const modules = await Promise.all(
          (permission.assignedModules || []).map((moduleId) => ctx.db.get(moduleId))
        );
  
        return {
          ...permission,
          assignedRoles: roles
            .filter((role) => role !== null) // Filter out nulls (in case a role was deleted)
            .map((role) => role.name), // Extract role names
          assignedModules: modules
            .filter((module) => module !== null) // Filter out nulls (in case a module was deleted)
            .map((module) => module.name), // Extract module names
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

// Add this new query
export const fetchPermissionById = query({
    args: { id: v.id("permissions") }, // Single permission ID
    handler: async (ctx, args) => {
        const permission = await ctx.db.get(args.id);
        if (!permission) return null;

        // Fetch assigned roles
        const roles = await Promise.all(
            (permission.assignedRoles || []).map((roleId) => ctx.db.get(roleId))
        );

        return {
            ...permission,
            assignedRoles: roles
                .filter((role) => role !== null) // Filter out nulls
                .map((role) => role.name), // Extract role names
        };
    },
});