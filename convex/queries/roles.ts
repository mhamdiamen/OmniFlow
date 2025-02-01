import { v } from "convex/values";
import { query } from "../_generated/server";

export const getRoles = query(async ({ db }) => {
    const roles = await db.query("roles").collect();

    return await Promise.all(
        roles.map(async (role) => {
            const permissionNames = await Promise.all(
                role.permissions.map(async (permissionId) => {
                    const permission = await db.get(permissionId);
                    return permission?.name || "Unknown"; // Fallback if the permission is missing
                })
            );

            return {
                ...role,
                permissions: permissionNames, // Replace IDs with names
            };
        })
    );
});
export const getRoleById = query({
    args: { id: v.id("roles") }, // Role ID to fetch
    handler: async ({ db }, { id }) => {
      const role = await db.get(id);
      if (!role) return null;
  
      // Return the role with permission IDs (not names)
      return {
        ...role,
        permissions: role.permissions, // Keep as permission IDs
      };
    },
  });