// src/server/modules.ts
import { v } from "convex/values";
import { query } from "../_generated/server";

// Fetch all modules along with their active state for a specific company.
export const fetchAllModules = query({
    args: { companyId: v.optional(v.id("companies")) },
    handler: async (ctx, { companyId }) => {
        const modules = await ctx.db.query("modules").collect();

        if (!companyId) {
            return modules.map((module) => ({
                ...module,
                isActive: false,
            }));
        }

        const companyModules = await ctx.db
            .query("company_modules")
            .filter((q) => q.eq(q.field("companyId"), companyId))
            .collect();

        const activeModuleIds = new Set(companyModules.map((cm) => cm.moduleId));

        return modules.map((module) => ({
            ...module,
            isActive: activeModuleIds.has(module._id),
        }));
    },
});

// 2. Fetch a single module by its ID along with its assigned permission names.
export const fetchModuleById = query({
    args: { id: v.id("modules") },
    handler: async (ctx, args) => {
        const module = await ctx.db.get(args.id);
        if (!module) return null;

        const permissions = await Promise.all(
            (module.permissions || []).map((permissionId) => ctx.db.get(permissionId))
        );

        return {
            ...module,
            permissions: permissions
                .filter((perm) => perm !== null)
                .map((perm) => perm.name),
        };
    },
});
export const fetchModuleByIdForUpdate = query({
    args: { id: v.id("modules") },
    handler: async (ctx, args) => {
        const module = await ctx.db.get(args.id);
        if (!module) return null;
        // Return the module as-is (permissions remain an array of IDs)
        return module;
    },
});

// 3. Fetch modules by an array of module IDs.
export const fetchModulesByIds = query({
    args: { ids: v.array(v.id("modules")) },
    handler: async (ctx, args) => {
        const modules = await Promise.all(
            args.ids.map((id) => ctx.db.get(id))
        );
        // Filter out any nulls (in case a module was deleted)
        return modules.filter((module) => module !== null);
    },
});

// 4. Fetch modules activated for a specific company.
// This query uses the "company_modules" table to find which modules are activated for a given company,
// then fetches the corresponding module records.
export const fetchModulesForCompany = query({
    args: { companyId: v.string() },
    handler: async (ctx, args) => {
        // Get all company_modules entries for this company.
        const companyModuleRecords = await ctx.db
            .query("company_modules")
            .filter((q) => q.eq(q.field("companyId"), args.companyId))
            .collect();

        // Extract the module IDs from these records.
        const moduleIds = companyModuleRecords.map((record) => record.moduleId);

        // Fetch each module record.
        const modules = await Promise.all(
            moduleIds.map((moduleId) => ctx.db.get(moduleId))
        );

        // Optionally, you could also resolve each module's permissions as in the other queries.
        return modules.filter((module) => module !== null);
    },
});

// In your query:
export const getActivatedModules = query({
    args: { companyId: v.string() },
    handler: async ({ db }, { companyId }) => {
        // Query the company_modules table for this company.
        const companyModules = await db
            .query("company_modules")
            .filter((b) => b.eq(b.field("companyId"), companyId))
            .collect();

        const activatedModuleIds = companyModules.map((cm) => cm.moduleId);
        if (activatedModuleIds.length === 0) return [];

        // Fetch the activated modules.
        const modules = await db
            .query("modules")
            .filter((b) =>
                b.or(...activatedModuleIds.map((id) => b.eq(b.field("_id"), id)))
            )
            .collect();

        return modules.map((module) => ({
            id: module._id,
            name: module.name,
            // Use the customRoute (e.g., "/crm", "/project-management") directly.
            route: `/modules${module.customRoute}`,
            description: module.description,
            isActiveByDefault: module.isActiveByDefault,
            permissions: module.permissions,
        }));
    },
});