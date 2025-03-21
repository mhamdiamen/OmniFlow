import { v } from "convex/values";
import { query } from "../_generated/server";
import { Id, Doc } from "../_generated/dataModel";

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

// In your Convex backend (e.g., users.ts)
export const fetchUsersWithInvitationByCompanyId = query({
    args: {
        companyId: v.id("companies"),
    },
    handler: async (ctx, args) => {
        const { companyId } = args;

        // Fetch all users associated with the company
        const users = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("companyId"), companyId))
            .collect();

        // Fetch all invitations for this company
        const invitations = await ctx.db
            .query("invitations")
            .filter((q) => q.eq(q.field("companyId"), companyId))
            .collect();

        // Get company details
        const company = await ctx.db.get(companyId);

        // Create a map of email to invitations for quick lookup
        const invitationsByEmail = new Map();
        invitations.forEach(invitation => {
            if (!invitationsByEmail.has(invitation.email)) {
                invitationsByEmail.set(invitation.email, []);
            }
            invitationsByEmail.get(invitation.email).push(invitation);
        });

        // Process existing users with their invitations
        const usersWithInvitations = await Promise.all(
            users.map(async (user) => {
                const role = user.roleId
                    ? await ctx.db.get(user.roleId as Id<"roles">)
                    : null;

                // Exclude users with the "Company Owner" role
                if (role?.name === "Company Owner") {
                    return null;
                }

                // Get the latest invitation for this user by email
                const userInvitations = invitationsByEmail.get(user.email) || [];
                
                // Sort invitations by creation time (newest first)
                userInvitations.sort((a: Doc<"invitations">, b: Doc<"invitations">) => b._creationTime - a._creationTime);
                
                // Remove from map to track processed invitations
                invitationsByEmail.delete(user.email);
                
                // Get the latest invitation
                const latestInvitation = userInvitations[0] || null;
                
                // Get inviter details if available
                let invitedByDetails = null;
                if (latestInvitation?.invitedBy) {
                    const inviter = await ctx.db.get(latestInvitation.invitedBy as Id<"users">);
                    if (inviter) {
                        invitedByDetails = {
                            _id: inviter._id,
                            name: inviter.name || "N/A",
                            email: inviter.email,
                            image: inviter.image
                        };
                    }
                }

                return {
                    ...user,
                    companyName: company ? company.name : "N/A",
                    roleName: role?.name ?? "N/A",
                    invitationStatus: latestInvitation?.status || null,
                    invitationAcceptedAt: latestInvitation?.acceptedAt || null,
                    invitedBy: invitedByDetails
                };
            })
        );

        // Filter out null values (users with "Company Owner" role)
        const filteredUsersWithInvitations = usersWithInvitations.filter(user => user !== null);

        // Process invitations without user accounts
        const pendingInvitationsWithoutUsers = await Promise.all(
            Array.from(invitationsByEmail.entries()).map(async ([email, invitations]) => {
                // Sort invitations by creation time (newest first)
                invitations.sort((a: Doc<"invitations">, b: Doc<"invitations">) => b._creationTime - a._creationTime);
                
                // Get the latest invitation
                const latestInvitation = invitations[0];
                
                // Get inviter details if available
                let invitedByDetails = null;
                if (latestInvitation?.invitedBy) {
                    const inviter = await ctx.db.get(latestInvitation.invitedBy as Id<"users">);
                    if (inviter) {
                        invitedByDetails = {
                            _id: inviter._id,
                            name: inviter.name || "N/A",
                            email: inviter.email,
                            image: inviter.image
                        };
                    }
                }
                
                // Create a pseudo-user entry for each email with pending invitations
                return {
                    _id: latestInvitation._id as unknown as Id<"users">, // Use the invitation ID as a placeholder
                    email: email,
                    companyId: companyId,
                    companyName: company ? company.name : "N/A",
                    invitationStatus: latestInvitation.status,
                    invitationAcceptedAt: latestInvitation.acceptedAt || null,
                    invitedBy: invitedByDetails
                };
            })
        );

        // Combine both arrays
        return [...filteredUsersWithInvitations, ...pendingInvitationsWithoutUsers];
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

export const getUsersByIds = query({
  args: {
    userIds: v.array(v.id("users"))
  },
  handler: async (ctx, args) => {
    const users = await Promise.all(
      args.userIds.map(userId => ctx.db.get(userId))
    );
    return users.filter((user): user is Doc<"users"> => user !== null);
  }
});