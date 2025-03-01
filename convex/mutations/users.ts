import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const updateUserRole = mutation({
    args: {
        userId: v.id("users"),
        newRoleId: v.optional(v.id("roles")),
    },
    handler: async (ctx, args) => {
        const { userId, newRoleId } = args;

        // Fetch the user to ensure they exist
        const user = await ctx.db.get(userId);
        if (!user) {
            throw new Error("User not found");
        }

        // Update the user's role
        await ctx.db.patch(userId, { roleId: newRoleId });
        return { success: true, message: "User role updated successfully" };
    },
});
export const revokeUserFromCompany = mutation({
    args: {
        userId: v.id("users"), // The ID of the user to revoke
    },
    handler: async (ctx, args) => {
        const { userId } = args;

        // Fetch the user to ensure they exist
        const user = await ctx.db.get(userId);
        if (!user) {
            throw new Error("User not found");
        }

        // Check if the user is associated with a company
        if (!user.companyId) {
            throw new Error("User is not associated with any company");
        }

        // Get the default role
        const defaultRole = await ctx.db
            .query("roles")
            .filter((q) => q.eq(q.field("name"), "Default"))
            .first();

        if (!defaultRole) {
            throw new Error("Default role not found");
        }

        // Revoke the user by removing companyId and setting roleId to the default role
        await ctx.db.patch(userId, {
            companyId: undefined,
            roleId: defaultRole._id
        });

        // Remove the user from all teams in the company
        const teams = await ctx.db
            .query("teams")
            .filter((q) => q.eq(q.field("companyId"), user.companyId))
            .collect();

        for (const team of teams) {
            if (team.members.includes(userId)) {
                const updatedMembers = team.members.filter((memberId) => memberId !== userId);
                await ctx.db.patch(team._id, { members: updatedMembers });
            }
        }

        return {
            success: true,
            message: "User revoked from company and assigned Default role"
        };
    },
});


export const updateUserProfile = mutation({
    args: {
        userId: v.id("users"),
        updates: v.object({
            name: v.optional(v.string()),
            image: v.optional(v.string()),
            phone: v.optional(v.string()),
            jobTitle: v.optional(v.string()),
            quote: v.optional(v.string()), // User's personal quote
            department: v.optional(v.string()),
            bio: v.optional(v.string()),
            skills: v.optional(v.array(v.string())),
            certifications: v.optional(v.array(v.string())),
            experience: v.optional(v.array(v.object({
                title: v.string(),
                company: v.string(),
                startDate: v.float64(),
                endDate: v.optional(v.float64()),
                description: v.optional(v.string()),
            }))),
            education: v.optional(v.array(v.object({
                institution: v.string(),
                degree: v.string(),
                fieldOfStudy: v.string(),
                startDate: v.float64(),
                endDate: v.optional(v.float64()),
            }))),
            socialLinks: v.optional(v.object({
                linkedin: v.optional(v.string()),
                twitter: v.optional(v.string()),
                github: v.optional(v.string()),
            })),
        }),
    },
    handler: async (ctx, args) => {
        const { userId, updates } = args;

        // Fetch the existing user
        const user = await ctx.db.get(userId);
        if (!user) {
            throw new Error("User not found");
        }

        // Ensure restricted fields are not being updated
        const restrictedFields = ["companyId", "roleId", "teamId", "emailVerificationTime", "phoneVerificationTime", "lastLogin"];
        for (const field of restrictedFields) {
            if (field in updates) {
                throw new Error(`Field "${field}" cannot be updated.`);
            }
        }

        // Apply updates
        await ctx.db.patch(userId, updates);

        return { success: true, message: "User profile updated successfully" };
    },
});
