import { v4 as uuidv4 } from "uuid";
import { mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { v } from "convex/values";
import { createActivityForUser } from "./recentActivity";

export const inviteUser = mutation({
    args: {
        email: v.string(),
        companyId: v.id("companies"),
        invitedBy: v.id("users"),
        token: v.string(),
        expiresAt: v.float64(),
    },
    handler: async (ctx, args) => {
        const { email, companyId, invitedBy, token, expiresAt } = args;

        // Check if the user exists and is not part of another company
        const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("email"), email))
            .unique();
        if (!user) {
            throw new Error("User not found.");
        }
        if (user.companyId) {
            throw new Error("User already belongs to a company.");
        }

        // Store the invitation in the database
        await ctx.db.insert("invitations", {
            email,
            token,
            status: "pending",
            companyId,
            invitedBy,
            invitedAt: Date.now(),
            expiresAt,
        });

        // Create recent activity using the existing mutation
        await createActivityForUser(ctx, {
            userId: invitedBy,
            actionType: "Invited User ",
            targetId: user._id,
            targetType: "user",
            description: `Invited ${email} to join the company`,
            metadata: {
                email,
                companyId,
            },
        });

        return { success: true, token };
    },
});

// convex/invitations.js


export const acceptInvitation = mutation(async (ctx, { token }: { token: string }) => {
    const { db } = ctx;

    // Fetch the invitation from the database
    const invitation = await db
        .query("invitations")
        .filter((q) => q.eq(q.field("token"), token))
        .first();
    if (!invitation || invitation.status !== "pending") {
        throw new Error("Invalid or expired invitation.");
    }

    // Check if the invitation has expired
    if (invitation.expiresAt < Date.now()) {
        await db.patch(invitation._id, { status: "expired" });
        throw new Error("Invitation has expired.");
    }

    // Associate the user with the company
    const user = await db
        .query("users")
        .filter((q) => q.eq(q.field("email"), invitation.email))
        .first();
    if (!user) {
        throw new Error("User not found.");
    }

    await db.patch(user._id, { companyId: invitation.companyId });
    await db.patch(invitation._id, { status: "accepted", acceptedAt: Date.now() });

    // Create recent activity for the accepting user
    await createActivityForUser(ctx, {
        userId: user._id,
        actionType: "Accepted Invitation",
        targetId: invitation.companyId,
        targetType: "company",
        description: `Accepted the invitation to join the company`,
        metadata: {
            invitedBy: invitation.invitedBy,
            companyId: invitation.companyId,
        },
    });

    return { success: true };
});