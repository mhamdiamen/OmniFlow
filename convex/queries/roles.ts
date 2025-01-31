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
