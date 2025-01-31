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
    if (!user || !user.companyId || !user.roleId) return false;

    // Fetch the role from the database (ensure the correct type)
    const role = await ctx.db.get(user.roleId as Id<"roles">);
    if (!role || !role.permissions.includes(permission)) return false;

    return true;
}
