import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/* export const createCompany = mutation({
  args: {
    name: v.string(), // Company name
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    // 1️⃣ Create the company
    const companyId = await ctx.db.insert("companies", {
      name: args.name,
      ownerId: userId,
      createdAt: Date.now(),
      modules: [],
      settings: {},
    });

    // 2️⃣ Define Company Owner permissions
    const ownerPermissions = ["manage_users", "manage_company_settings", "manage_roles"];

    // 3️⃣ Fetch or insert permissions and get their IDs
    const permissionIds = [];
    for (const permissionName of ownerPermissions) {
      let permission = await ctx.db.query("permissions").filter({ name: permissionName }).unique();
      if (!permission) {
        permission = await ctx.db.insert("permissions", { name: permissionName });
      }
      permissionIds.push(permission._id as Id<"permissions">);
    }

    // 4️⃣ Create the "Company Owner" role
    const roleId = await ctx.db.insert("roles", {
      companyId,
      name: "Company Owner",
      permissions: permissionIds, // Use permission IDs
    });

    // 5️⃣ Assign the role to the user
    await ctx.db.patch(userId, {
      companyId,
      roleId: roleId as Id<"roles">,
    });

    return { companyId, roleId };
  },
}); */

