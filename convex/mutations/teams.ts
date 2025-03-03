import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create a new team
export const createTeam = mutation({
  args: {
    name: v.string(),
    companyId: v.id("companies"),
    members: v.array(v.id("users")),
    createdBy: v.id("users"), // Add createdBy field
    teamLeaderId: v.optional(v.id("users")), // Add this line
  },
  handler: async (ctx, { name, companyId, members, createdBy, teamLeaderId }) => {
    // Ensure the user exists
    const user = await ctx.db.get(createdBy);
    if (!user) {
      throw new Error("User not found");
    }

    // Create the team
    const teamId = await ctx.db.insert("teams", {
      name,
      companyId,
      members,
      createdBy,
      createdAt: Date.now(),
      teamLeaderId, // Add this line
    });

    // Update users with the new teamId
    for (const memberId of members) {
      await ctx.db.patch(memberId, { teamId });
    }

    return teamId;
  },
});

export const updateTeam = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.optional(v.string()),
    members: v.optional(v.array(v.id("users"))),
    teamLeaderId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Get the existing team
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    // Validate teamLeaderId if provided
    if (args.teamLeaderId) {
      const teamLeader = await ctx.db.get(args.teamLeaderId);
      if (!teamLeader) throw new Error("Team leader not found");
    }

    // Update the team with new values, keeping existing values if not provided
    await ctx.db.patch(args.teamId, {
      ...(args.name && { name: args.name }),
      ...(args.members && { members: args.members }),
      ...(args.teamLeaderId && { teamLeaderId: args.teamLeaderId }),
    });

    // Update users with the new teamId
    if (args.members) {
      // Clear teamId for users who are no longer members
      const removedMembers = args.members ? team.members.filter(memberId => !(args.members ?? []).includes(memberId)) : [];
      for (const memberId of removedMembers) {
        await ctx.db.patch(memberId, { teamId: undefined });
      }

      // Set teamId for new members
      for (const memberId of args.members) {
        await ctx.db.patch(memberId, { teamId: args.teamId });
      }
    }

    return { success: true, message: "Team updated successfully" };
  },
});

// Add members to a team
export const addTeamMembers = mutation({
  args: {
    teamId: v.id("teams"),
    memberIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get the user from the database
    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), identity.email))
      .first();
    
    if (!user) throw new Error("User not found");

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    // Check if user is the creator or a member
    if (team.createdBy !== user._id && !team.members.includes(user._id)) {
      throw new Error("Not authorized to modify this team");
    }

    const updatedMembers = [...new Set([...team.members, ...args.memberIds])];
    await ctx.db.patch(args.teamId, {
      members: updatedMembers,
    });

    return { success: true, message: "Members added successfully" };
  },
});

// Remove members from a team
export const removeTeamMembers = mutation({
  args: {
    teamId: v.id("teams"),
    memberIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get the user from the database
    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), identity.email))
      .first();
    
    if (!user) throw new Error("User not found");

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    // Check if user is the creator
    if (team.createdBy !== user._id) {
      throw new Error("Only team creator can remove members");
    }

    // Don't allow removing the creator
    const memberIdsToRemove = args.memberIds.filter(id => id !== team.createdBy);
    const updatedMembers = team.members.filter(
      id => !memberIdsToRemove.includes(id)
    );

    await ctx.db.patch(args.teamId, {
      members: updatedMembers,
    });

    // Clear teamId for removed members
    for (const memberId of memberIdsToRemove) {
      await ctx.db.patch(memberId, { teamId: undefined });
    }

    return { success: true, message: "Members removed successfully" };
  },
});

// Delete a team
export const deleteTeam = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    // Clear teamId for all members of the team
    for (const memberId of team.members) {
      await ctx.db.patch(memberId, { teamId: undefined });
    }

    await ctx.db.delete(args.teamId);
    return { success: true, message: "Team deleted successfully" };
  },
});

// Bulk delete teams
export const bulkDeleteTeams = mutation({
  args: {
    teamIds: v.array(v.id("teams")), // Array of team IDs to delete
  },
  handler: async (ctx, args) => {
    const { teamIds } = args;
    
    if (teamIds.length === 0) {
      return {
        success: false,
        message: "No teams specified for deletion",
        deletedCount: 0
      };
    }

    let deletedCount = 0;
    const errors = [];

    // Process each team
    for (const teamId of teamIds) {
      try {
        // Fetch the team to ensure it exists
        const team = await ctx.db.get(teamId);
        if (!team) {
          errors.push(`Team with ID ${teamId} not found`);
          continue;
        }

        // Clear teamId for all members of the team
        for (const memberId of team.members) {
          await ctx.db.patch(memberId, { teamId: undefined });
        }

        // Delete the team
        await ctx.db.delete(teamId);
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting team ${teamId}:`, error);
        const errorMessage = error instanceof Error 
          ? error.message 
          : String(error);
        errors.push(`Failed to delete team ${teamId}: ${errorMessage}`);
      }
    }

    return {
      success: deletedCount > 0,
      message: errors.length > 0 
        ? `Deleted ${deletedCount} teams with ${errors.length} errors: ${errors.join(', ')}` 
        : `Successfully deleted ${deletedCount} teams`,
      deletedCount,
      errors: errors.length > 0 ? errors : undefined
    };
  },
});
