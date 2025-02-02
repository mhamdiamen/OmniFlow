import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

/**
 * Activates a module for a company.
 */
export const activateModuleForCompany = mutation({
    args: {
        companyId: v.id("companies"),
        moduleId: v.id("modules"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("User not authenticated");

        // Ensure the company exists.
        const company = await ctx.db.get(args.companyId);
        if (!company) throw new Error("Company not found");

        // Ensure the module exists.
        const moduleDoc = await ctx.db.get(args.moduleId);
        if (!moduleDoc) throw new Error("Module not found");

        // Check if a company_modules record already exists for this company and module.
        const existingRecord = await ctx.db
            .query("company_modules")
            .filter((q) =>
                q.and(
                    q.eq(q.field("companyId"), args.companyId),
                    q.eq(q.field("moduleId"), args.moduleId)
                )
            )
            .first();

        if (existingRecord) {
            // Module already activated for this company.
            return { success: true, message: "Module already activated for this company" };
        }

        // Insert the activation record.
        const recordId = await ctx.db.insert("company_modules", {
            companyId: args.companyId,
            moduleId: args.moduleId,
            activatedBy: userId,
            activatedAt: Date.now(),
        });

        // Update the company's modules array if it doesn't already include the module.
        if (!company.modules.includes(args.moduleId)) {
            const updatedModules = [...company.modules, args.moduleId];
            await ctx.db.patch(args.companyId, { modules: updatedModules });
        }

        return { success: true, recordId };
    },
});

/**
 * Deactivates a module for a company.
 */
export const deactivateModuleForCompany = mutation({
    args: {
        companyId: v.id("companies"),
        moduleId: v.id("modules"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("User not authenticated");

        // Ensure the company exists.
        const company = await ctx.db.get(args.companyId);
        if (!company) throw new Error("Company not found");

        // Find the existing activation record.
        const record = await ctx.db
            .query("company_modules")
            .filter((q) =>
                q.and(
                    q.eq(q.field("companyId"), args.companyId),
                    q.eq(q.field("moduleId"), args.moduleId)
                )
            )
            .first();

        if (record) {
            // Delete the record from the company_modules table.
            await ctx.db.delete(record._id);
        }

        // Remove the module ID from the company's modules array if present.
        if (company.modules.includes(args.moduleId)) {
            const updatedModules = company.modules.filter((id: string) => id !== args.moduleId);
            await ctx.db.patch(args.companyId, { modules: updatedModules });
        }

        return { success: true };
    },
});
