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


export const updateCompany = mutation({
  args: {
    companyId: v.id("companies"),
    name: v.string(),
    logoUrl: v.optional(v.string()),  // NEW: logoUrl field
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(
      v.object({
        street: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        zip: v.optional(v.string()),
        country: v.optional(v.string()),
      })
    ),
    industry: v.optional(v.string()),
    size: v.optional(v.string()),
    socialLinks: v.optional(
      v.object({
        facebook: v.optional(v.string()),
        twitter: v.optional(v.string()),
        linkedin: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.companyId, {
      name: args.name,
      logoUrl: args.logoUrl, // Ensure this is updated
      website: args.website,
      phone: args.phone,
      email: args.email,
      address: args.address,
      industry: args.industry,
      size: args.size,
      socialLinks: args.socialLinks,
    });
  },
});

export const deleteCompany = mutation({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, { companyId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    // Ensure the company exists.
    const company = await ctx.db.get(companyId);
    if (!company) throw new Error("Company not found");

    // Fetch all company_modules entries for this company.
    const companyModules = await ctx.db
      .query("company_modules")
      .filter((q) => q.eq(q.field("companyId"), companyId))
      .collect();

    // Decrement the activationCount for each module.
    for (const companyModule of companyModules) {
      const moduleDoc = await ctx.db.get(companyModule.moduleId);
      if (moduleDoc) {
        await ctx.db.patch(companyModule.moduleId, {
          activationCount: (moduleDoc.activationCount || 0n) - 1n,
        });
      }
    }

    // Delete all company_modules entries for this company.
    for (const companyModule of companyModules) {
      await ctx.db.delete(companyModule._id);
    }

    // Delete the company.
    await ctx.db.delete(companyId);

    return { success: true };
  },
});