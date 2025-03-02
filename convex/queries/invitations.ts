//this is the invitation query page 

import { v } from "convex/values";
import { query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export const fetchInvitationsByCompanyId = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const { companyId } = args;

    // Fetch all invitations for this company
    const invitations = await ctx.db
      .query("invitations")
      .filter((q) => q.eq(q.field("companyId"), companyId))
      .collect();

    // For each invitation, fetch the inviter's details
    return await Promise.all(
      invitations.map(async (invitation) => {
        // Get inviter details
        const inviter = await ctx.db.get(invitation.invitedBy);

        // Get company details
        const company = await ctx.db.get(invitation.companyId);

        // Return enriched invitation data
        return {
          ...invitation,
          inviterName: inviter?.name || "Unknown",
          inviterEmail: inviter?.email || "Unknown",
          companyName: company?.name || "Unknown",
        };
      })
    );
  },
});

// Fetch a specific invitation by token
export const fetchInvitationByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { token } = args;

    const invitation = await ctx.db
      .query("invitations")
      .filter((q) => q.eq(q.field("token"), token))
      .unique();

    if (!invitation) {
      return null;
    }

    // Get company details
    const company = await ctx.db.get(invitation.companyId);

    // Get inviter details
    const inviter = await ctx.db.get(invitation.invitedBy);

    return {
      ...invitation,
      companyName: company?.name || "Unknown",
      inviterName: inviter?.name || "Unknown",
      inviterEmail: inviter?.email || "Unknown",
    };
  },
});

// Fetch all invitations for a specific email
export const fetchInvitationsByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const { email } = args;

    const invitations = await ctx.db
      .query("invitations")
      .filter((q) => q.eq(q.field("email"), email))
      .collect();

    return await Promise.all(
      invitations.map(async (invitation) => {
        // Get company details
        const company = await ctx.db.get(invitation.companyId);

        // Get inviter details
        const inviter = await ctx.db.get(invitation.invitedBy);

        return {
          ...invitation,
          companyName: company?.name || "Unknown",
          inviterName: inviter?.name || "Unknown",
          inviterEmail: inviter?.email || "Unknown",
        };
      })
    );
  },
});

// Fetch all invitations for a company
export const fetchAllInvitationsForCompany = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const { companyId } = args;

    // Fetch all invitations for this company
    const invitations = await ctx.db
      .query("invitations")
      .filter((q) => q.eq(q.field("companyId"), companyId))
      .collect();

    return invitations;
  },
});

// Fetch all invitations for a company with detailed information and sorting options
export const fetchDetailedInvitationsForCompany = query({
  args: { 
    companyId: v.id("companies"),
    sortBy: v.optional(v.string()),
    sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("expired"),
      v.literal("all")
    ))
  },
  handler: async (ctx, args) => {
    const { companyId, sortBy = "invitedAt", sortDirection = "desc", status = "all" } = args;

    // Build the query
    let invitationsQuery = ctx.db
      .query("invitations")
      .filter((q) => q.eq(q.field("companyId"), companyId));

    // Add status filter if specified and not "all"
    if (status && status !== "all") {
      invitationsQuery = invitationsQuery.filter((q) => 
        q.eq(q.field("status"), status)
      );
    }

    // Collect all matching invitations
    const invitations = await invitationsQuery.collect();

    // Fetch additional details for each invitation
    const detailedInvitations = await Promise.all(
      invitations.map(async (invitation) => {
        // Get inviter details
        const inviter = await ctx.db.get(invitation.invitedBy);

        // Get company details
        const company = await ctx.db.get(invitation.companyId);

        // Check if the invited user has an account
        const existingUser = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("email"), invitation.email))
          .first();

        // Return enriched invitation data
        return {
          ...invitation,
          inviterName: inviter?.name || "Unknown",
          inviterEmail: inviter?.email || "Unknown",
          companyName: company?.name || "Unknown",
          hasUserAccount: !!existingUser,
          userId: existingUser?._id,
        };
      })
    );

    // Sort the results
    const sortedInvitations = [...detailedInvitations].sort((a, b) => {
      // Handle different sort fields
      let valueA, valueB;
      
      switch (sortBy) {
        case "email":
          valueA = a.email.toLowerCase();
          valueB = b.email.toLowerCase();
          break;
        case "status":
          valueA = a.status;
          valueB = b.status;
          break;
        case "invitedAt":
          valueA = a.invitedAt;
          valueB = b.invitedAt;
          break;
        case "acceptedAt":
          // Handle null values for acceptedAt
          valueA = a.acceptedAt || 0;
          valueB = b.acceptedAt || 0;
          break;
        case "inviterName":
          valueA = a.inviterName.toLowerCase();
          valueB = b.inviterName.toLowerCase();
          break;
        default:
          // Default to sorting by invitedAt
          valueA = a.invitedAt;
          valueB = b.invitedAt;
      }

      // Apply sort direction
      if (sortDirection === "asc") {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });

    return sortedInvitations;
  },
});