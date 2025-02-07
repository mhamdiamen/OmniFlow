import { v } from "convex/values";
import { query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export const fetchAllUsers = query({
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        return await Promise.all(users.map(async (user) => {
            const company = user.companyId ? await ctx.db.get(user.companyId as Id<"companies">) : null;
            const role = user.roleId ? await ctx.db.get(user.roleId as Id<"roles">) : null;
            return {
                ...user,
                companyName: company ? company.name : "N/A",
                roleName: role ? role.name : "N/A"
            };
        }));
    },
});

export const fetchUserByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("email"), args.email))
            .unique();
        if (user) {
            const companyId = user.companyId ? ctx.db.normalizeId("companies", user.companyId) : null;
            const company = companyId ? await ctx.db.get(companyId) : null;
            const role = user.roleId ? await ctx.db.get(user.roleId as Id<"roles">) : null;
            return {
                ...user,
                companyName: company ? company.name : "N/A",
                roleName: role ? role.name : "N/A"
            };
        }
        return null;
    },
});

export const fetchUsersByCompanyId = query({
    args: { companyId: v.string() },
    handler: async (ctx, args) => {
        const users = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("companyId"), args.companyId))
            .collect();
        const companyId = ctx.db.normalizeId("companies", args.companyId);
        const company = companyId ? await ctx.db.get(companyId) : null;
        return await Promise.all(users.map(async user => ({
            ...user,
            companyName: company ? company.name : "N/A",
            roleName: user.roleId ? ((await ctx.db.get(user.roleId as Id<"roles">))?.name ?? "N/A") : "N/A"
        })));
    },
});

export const fetchUserById = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (user) {
            const companyId = user.companyId ? ctx.db.normalizeId("companies", user.companyId) : null;
            const company = companyId ? await ctx.db.get(companyId) : null;
            const role = user.roleId ? await ctx.db.get(user.roleId as Id<"roles">) : null;
            return {
                ...user,
                companyName: company ? company.name : "N/A",
                roleName: role ? role.name : "N/A"
            };
        }
        return null;
    },
});

export const fetchUsersByRoleId = query({
    args: { roleId: v.string() },
    handler: async (ctx, args) => {
        const users = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("roleId"), args.roleId))
            .collect();
        const roleId = ctx.db.normalizeId("roles", args.roleId);
        const role = roleId ? await ctx.db.get(roleId) : null;
        return await Promise.all(users.map(async (user) => {
            const company = user.companyId ? await ctx.db.get(user.companyId as Id<"companies">) : null;
            return {
                ...user,
                companyName: company ? company.name : "N/A",
                roleName: role ? role.name : "N/A"
            };
        }));
    },
});