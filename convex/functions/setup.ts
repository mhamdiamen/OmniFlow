import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

export const initializeSuperAdmin = mutation({
    args: {
        superAdminEmail: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if the Super Admin role already exists
        let superAdminRole = await ctx.db
            .query("roles")
            .filter(q => q.eq(q.field("name"), "Super Admin"))
            .first();

        if (!superAdminRole) {
            // Create the Super Admin role with all permissions
            const allPermissions = await ctx.db.query("permissions").collect();
            const permissionIds = allPermissions.map(p => p._id);

            const roleId = await ctx.db.insert("roles", {
                companyId: undefined, // No company restriction
                name: "Super Admin",
                description: "Full system access",
                permissions: permissionIds,
            });

            superAdminRole = await ctx.db.get(roleId);
        }

        if (!superAdminRole?._id) throw new Error("Failed to create Super Admin role");

        // Find or create the user with the given email
        let user = await ctx.db.query("users").filter(q => q.eq(q.field("email"), args.superAdminEmail)).first();

        if (!user) throw new Error("User not found. Register first, then run this function.");

        // Assign the user the Super Admin role
        await ctx.db.patch(user._id, { roleId: superAdminRole._id });

        return { success: true, message: `User ${args.superAdminEmail} is now Super Admin` };
    },
});
