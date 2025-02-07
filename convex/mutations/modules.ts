import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createModule = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        customRoute: v.string(),
        description: v.optional(v.string()),
        isActiveByDefault: v.boolean(),
        permissions: v.optional(v.array(v.id("permissions"))),
        category: v.optional(v.string()),
        activationCount: v.optional(v.number()), // Use `number` here for input
        releaseNotes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("User not authenticated");

        // Convert activationCount to bigint if provided
        const activationCount = args.activationCount !== undefined ? BigInt(args.activationCount) : undefined;

        // Insert the new module record
        const moduleId = await ctx.db.insert("modules", {
            name: args.name,
            slug: args.slug,
            customRoute: args.customRoute,
            description: args.description,
            isActiveByDefault: args.isActiveByDefault,
            permissions: args.permissions ?? [],
            category: args.category,
            activationCount, // Use the converted bigint value
            releaseNotes: args.releaseNotes,
        });

        return moduleId;
    },
});
export const deleteModule = mutation({
    args: {
        // Module ID to delete.
        id: v.id("modules"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("User not authenticated");

        // Ensure the module exists.
        const moduleDoc = await ctx.db.get(args.id);
        if (!moduleDoc) throw new Error("Module not found");

        // Delete the module from the "modules" table.
        await ctx.db.delete(args.id);

        // 1. Remove references in the "company_modules" table.
        // Here we cast the document to `any` so that TypeScript recognizes the field.
        const companyModuleEntries = await ctx.db
            .query("company_modules")
            .filter((doc) => (doc as any).moduleId === args.id)
            .collect();

        for (const entry of companyModuleEntries) {
            await ctx.db.delete(entry._id);
        }

        // 2. Remove references in the "permissions" table.
        // For each permission that includes this module in its "assignedModules" array,
        // update that array to remove the module's ID.
        const permissions = await ctx.db.query("permissions").collect();
        for (const permission of permissions) {
            if (permission.assignedModules.includes(args.id)) {
                const newAssignedModules = permission.assignedModules.filter(
                    (moduleId) => moduleId !== args.id
                );
                await ctx.db.patch(permission._id, { assignedModules: newAssignedModules });
            }
        }

        // 3. Remove references in the "companies" table.
        // For any company that includes the module in its "modules" array, remove it.
        const companies = await ctx.db.query("companies").collect();
        for (const company of companies) {
            if (company.modules.includes(args.id)) {
                const newModules = company.modules.filter((moduleId) => moduleId !== args.id);
                await ctx.db.patch(company._id, { modules: newModules });
            }
        }

        return { success: true };
    },
});

export const updateModule = mutation({
    args: {
      id: v.id("modules"),
      name: v.optional(v.string()),
      slug: v.optional(v.string()), // Add slug as an optional field
      customRoute: v.optional(v.string()), // Add customRoute as an optional field
      description: v.optional(v.string()),
      isActiveByDefault: v.optional(v.boolean()),
      permissions: v.optional(v.array(v.id("permissions"))),
      category: v.optional(v.string()), // New field
      releaseNotes: v.optional(v.string()), // New field
    },
    handler: async (ctx, args) => {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("User not authenticated");
  
      // Ensure the module exists.
      const moduleDoc = await ctx.db.get(args.id);
      if (!moduleDoc) throw new Error("Module not found");
  
      // Prepare the updated fields for the module.
      const updatedFields = {
        name: args.name ?? moduleDoc.name,
        slug: args.slug ?? moduleDoc.slug, // Include slug
        customRoute: args.customRoute ?? moduleDoc.customRoute, // Include customRoute
        description: args.description ?? moduleDoc.description,
        isActiveByDefault: args.isActiveByDefault ?? moduleDoc.isActiveByDefault,
        permissions: args.permissions ?? moduleDoc.permissions,
        category: args.category ?? moduleDoc.category, // New field
        releaseNotes: args.releaseNotes ?? moduleDoc.releaseNotes, // New field
      };
  
      // Patch the module document with the updated fields.
      await ctx.db.patch(args.id, updatedFields);
  
      // Update reverse relationships in the permissions table (if needed).
      const newPermissions = updatedFields.permissions;
      const oldPermissions = moduleDoc.permissions;
  
      const addedPermissions = newPermissions.filter(
        (permId) => !oldPermissions.includes(permId)
      );
      const removedPermissions = oldPermissions.filter(
        (permId) => !newPermissions.includes(permId)
      );
  
      for (const permId of addedPermissions) {
        const permission = await ctx.db.get(permId);
        if (!permission) continue;
        if (!permission.assignedModules.includes(args.id)) {
          const updatedAssignedModules = [...permission.assignedModules, args.id];
          await ctx.db.patch(permId, { assignedModules: updatedAssignedModules });
        }
      }
  
      for (const permId of removedPermissions) {
        const permission = await ctx.db.get(permId);
        if (!permission) continue;
        const updatedAssignedModules = permission.assignedModules.filter(
          (moduleId) => moduleId !== args.id
        );
        await ctx.db.patch(permId, { assignedModules: updatedAssignedModules });
      }
  
      return { success: true };
    },
  });
export const bulkDeleteModules = mutation({
    args: {
        // An array of module IDs to delete.
        ids: v.array(v.id("modules")),
    },
    handler: async (ctx, { ids }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("User not authenticated");

        // Ensure that every module in the list exists.
        // (Alternatively, you could choose to skip missing modules.)
        for (const id of ids) {
            const moduleDoc = await ctx.db.get(id);
            if (!moduleDoc) {
                throw new Error(`Module not found: ${id}`);
            }
        }

        // 1. Delete the modules from the "modules" table.
        for (const id of ids) {
            await ctx.db.delete(id);
        }

        // 2. Remove references in the "company_modules" table.
        // Delete every company_module entry that has a moduleId in our ids array.
        const companyModuleEntries = await ctx.db
            .query("company_modules")
            .filter((doc) => ids.includes((doc as any).moduleId))
            .collect();

        for (const entry of companyModuleEntries) {
            await ctx.db.delete(entry._id);
        }

        // 3. Update the "permissions" table.
        // Remove the module IDs from each permission's assignedModules array.
        const permissions = await ctx.db.query("permissions").collect();
        for (const permission of permissions) {
            // Only update if there is a change.
            const newAssignedModules = permission.assignedModules.filter(
                (moduleId) => !ids.includes(moduleId)
            );
            if (newAssignedModules.length !== permission.assignedModules.length) {
                await ctx.db.patch(permission._id, { assignedModules: newAssignedModules });
            }
        }

        // 4. Update the "companies" table.
        // Remove the module IDs from each company's modules array.
        const companies = await ctx.db.query("companies").collect();
        for (const company of companies) {
            const newModules = company.modules.filter((moduleId) => !ids.includes(moduleId));
            if (newModules.length !== company.modules.length) {
                await ctx.db.patch(company._id, { modules: newModules });
            }
        }

        return { success: true };
    },
});