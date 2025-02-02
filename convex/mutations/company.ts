import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export const createCompany = mutation({
  args: {
    name: v.string(),
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

    // 2️⃣ Check if "Company Owner" role exists (either for this company or globally)
    let companyOwnerRole = await ctx.db
    .query("roles")
    .filter(q => 
      q.or(
        q.eq(q.field("companyId"), [companyId]),  // Matches the exact array (if `companyId` is an array)
        q.eq(q.field("name"), "Company Owner")    // Global "Company Owner" role
      )
    )
    .first();
  

    // 3️⃣ If the role doesn't exist, create it
    if (!companyOwnerRole) {
      const ownerPermissions = ["manage_users", "manage_company_settings", "manage_roles"];

      // Fetch existing permissions
      const existingPermissions = await Promise.all(
        ownerPermissions.map(async (permissionName) =>
          ctx.db.query("permissions").filter(q => q.eq(q.field("name"), permissionName)).first()
        )
      );

      // Remove null values
      const existingPermissionsFiltered = existingPermissions.filter(Boolean) as { _id: Id<"permissions">; name: string }[];

      // Get existing permission IDs
      const existingPermissionIds = existingPermissionsFiltered.map(p => p._id);

      // Insert only missing permissions
      const newPermissionIds: Id<"permissions">[] = [];
      for (const permissionName of ownerPermissions) {
        if (!existingPermissionsFiltered.find(p => p.name === permissionName)) {
          const newPermissionId = await ctx.db.insert("permissions", {
            name: permissionName,
            assignedRoles: [],
            assignedModules: [], // Added this required field
          });
          newPermissionIds.push(newPermissionId);
        }
      }

      // Combine all permission IDs
      const permissionIds = [...existingPermissionIds, ...newPermissionIds];

      // Insert the new role and retrieve it
      const newRoleId = await ctx.db.insert("roles", {
        companyId: [companyId], // Store companyId as an array
        name: "Company Owner",
        permissions: permissionIds,
      });

      companyOwnerRole = await ctx.db.get(newRoleId);
      if (!companyOwnerRole) throw new Error("Failed to create the Company Owner role.");
    } else {
      // If the role exists, update its companyId array
      const updatedCompanyIds = [...(companyOwnerRole.companyId || []), companyId];
      await ctx.db.patch(companyOwnerRole._id, { companyId: updatedCompanyIds });
    }

    // 4️⃣ Assign the role to the user
    await ctx.db.patch(userId as Id<"users">, {
      companyId,
      roleId: companyOwnerRole._id as Id<"roles">,
    });

    return { companyId, roleId: companyOwnerRole._id };
  },
});
