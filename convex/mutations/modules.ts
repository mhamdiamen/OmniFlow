import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createModule = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        isActiveByDefault: v.boolean(),
        // Optionally accept an array of permission IDs to pre-assign to this module.
        permissions: v.optional(v.array(v.id("permissions"))),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("User not authenticated");

        // Insert the new module record into the modules table.
        const moduleId = await ctx.db.insert("modules", {
            name: args.name,
            description: args.description,
            isActiveByDefault: args.isActiveByDefault,
            permissions: args.permissions ?? [], // default to an empty array if not provided
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
        // Module ID to update.
        id: v.id("modules"),
        // Optional fields to update.
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        isActiveByDefault: v.optional(v.boolean()),
        // Optionally update the array of permission IDs.
        permissions: v.optional(v.array(v.id("permissions"))),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("User not authenticated");

        // Ensure the module exists.
        const moduleDoc = await ctx.db.get(args.id);
        if (!moduleDoc) throw new Error("Module not found");

        // Determine the new permissions array:
        // Use the new value if provided, otherwise fallback to the existing value.
        const newPermissions = args.permissions ?? moduleDoc.permissions;
        const oldPermissions = moduleDoc.permissions;

        // Prepare the updated fields for the module.
        const updatedFields = {
            name: args.name ?? moduleDoc.name,
            description: args.description ?? moduleDoc.description,
            isActiveByDefault: args.isActiveByDefault ?? moduleDoc.isActiveByDefault,
            permissions: newPermissions,
        };

        // Patch the module document with the updated fields.
        await ctx.db.patch(args.id, updatedFields);

        // ----- Update the reverse relationship in the permissions table -----
        // Compute permissions that were added and removed.
        const addedPermissions = newPermissions.filter(
            (permId) => !oldPermissions.includes(permId)
        );
        const removedPermissions = oldPermissions.filter(
            (permId) => !newPermissions.includes(permId)
        );

        // For each permission that was added, ensure the module is in its assignedModules array.
        for (const permId of addedPermissions) {
            const permission = await ctx.db.get(permId);
            if (!permission) continue;
            // Avoid duplicates: add the module ID only if it isn’t already present.
            if (!permission.assignedModules.includes(args.id)) {
                const updatedAssignedModules = [...permission.assignedModules, args.id];
                await ctx.db.patch(permId, { assignedModules: updatedAssignedModules });
            }
        }

        // For each permission that was removed, remove the module from its assignedModules array.
        for (const permId of removedPermissions) {
            const permission = await ctx.db.get(permId);
            if (!permission) continue;
            const updatedAssignedModules = permission.assignedModules.filter(
                (moduleId) => moduleId !== args.id
            );
            await ctx.db.patch(permId, { assignedModules: updatedAssignedModules });
        }
        // ---------------------------------------------------------------------

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