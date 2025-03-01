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


export const fetchUserAndInvitationByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const invitation = await ctx.db
            .query("invitations")
            .filter((q) => q.eq(q.field("email"), args.email))
            .unique();

        if (!invitation) {
            return null; // No invitation found
        }

        const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("email"), args.email))
            .unique();

        if (user) {
            const company = user.companyId ? await ctx.db.get(user.companyId as Id<"companies">) : null;
            const role = user.roleId ? await ctx.db.get(user.roleId as Id<"roles">) : null;

            return {
                invitation: invitation, // Include invitation details
                user: {                   // Include user details
                    ...user,
                    companyName: company ? company.name : "N/A",
                    roleName: role ? role.name : "N/A",
                },
            };
        } else {
            return {
                invitation: invitation, // Only invitation details are available
                user: null,              // User hasn't signed up yet
            };
        }
    },
});

export const fetchUsersWithInvitationByCompanyId = query({
    args: { companyId: v.string() },
    handler: async (ctx, args) => {
        const users = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("companyId"), args.companyId))
            .collect();

        const companyId = ctx.db.normalizeId("companies", args.companyId);
        const company = companyId ? await ctx.db.get(companyId) : null;

        return await Promise.all(
            users.map(async (user) => {
                const role = user.roleId
                    ? await ctx.db.get(user.roleId as Id<"roles">) // Get the entire role object
                    : null; // Set to null if roleId is missing

                const invitation = await ctx.db
                    .query("invitations")
                    .filter((q) => q.eq(q.field("email"), user.email))
                    .order("desc") // Correct usage
                    .first();


                return {
                    ...user,
                    companyName: company ? company.name : "N/A",
                    roleId: role?._id, // Include roleId as Id<"roles"> or undefined
                    roleName: role?.name ?? "N/A", // Include roleName
                    invitationStatus: invitation?.status || null,
                    invitationAcceptedAt: invitation?.acceptedAt || null,
                };
            })
        );
    },
});

export const getUserById = query({
    args: {
        userId: v.id("users"), // Accept the user ID as an argument
    },
    handler: async (ctx, args) => {
        const { userId } = args;

        // Fetch the user by ID
        const user = await ctx.db.get(userId);
        if (!user) {
            return null; // Return null if the user is not found
        }

        // Fetch the user's role
        const role = user.roleId ? await ctx.db.get(user.roleId as Id<"roles">) : null;

        // Fetch the user's company
        const companyId = ctx.db.normalizeId("companies", user.companyId || "");
        const company = companyId ? await ctx.db.get(companyId) : null;

        // Fetch the user's invitation (if applicable)
        const invitation = await ctx.db
            .query("invitations")
            .filter((q) => q.eq(q.field("email"), user.email))
            .order("desc")
            .first();

        // Return the user with additional details
        return {
            ...user,
            companyName: company ? company.name : "N/A",
            roleId: role?._id, // Include roleId as Id<"roles"> or undefined
            roleName: role?.name ?? "N/A", // Include roleName
            invitationStatus: invitation?.status || null,
            invitationAcceptedAt: invitation?.acceptedAt || null,
        };
    },
});