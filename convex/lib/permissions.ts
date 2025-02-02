import { Id } from "../_generated/dataModel";
import { QueryCtx, MutationCtx } from "../_generated/server";

/**
 * Checks if a user has the required permission within their company.
 */
export async function checkPermission(
    ctx: QueryCtx | MutationCtx,
    userId: Id<"users">,
    permission: string
): Promise<boolean> {
    const user = await ctx.db.get(userId);
    if (!user || !user.roleId) return false;

    const role = await ctx.db.get(user.roleId as Id<"roles">);
    if (!role) return false;

    // Allow Super Admins to do anything
    if (role.name === "Super Admin") return true;

    // Check if the permission exists in the role
    const permissions = await Promise.all(
        role.permissions.map((permissionId) => ctx.db.get(permissionId as Id<"permissions">))
    );

    return permissions.some((p) => p && p.name === permission);
}
