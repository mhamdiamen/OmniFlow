import { v } from "convex/values";
import { query } from "../_generated/server";

// Fetch all projects along with their details.
export const fetchAllProjects = query({
    args: { companyId: v.optional(v.id("companies")) },
    handler: async (ctx, { companyId }) => {
        const projects = await ctx.db.query("projects").collect();
        console.log("Fetched projects:", projects); // Add logging

        if (!companyId) {
            return projects;
        }

        const companyProjects = await ctx.db
            .query("projects")
            .filter((q) => q.eq(q.field("companyId"), companyId))
            .collect();
        console.log("Fetched company projects:", companyProjects); // Add logging

        return companyProjects;
    },
});
