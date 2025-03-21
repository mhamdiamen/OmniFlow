import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { createActivityForUser } from "./recentActivity";

// Create a new team
export const createTeam = mutation({
  args: {
    name: v.string(),
    companyId: v.id("companies"),
    members: v.array(v.id("users")),
    createdBy: v.id("users"), // Add createdBy field
    teamLeaderId: v.optional(v.id("users")), // Add this line
    description: v.optional(v.string()), // Add this line
    status: v.optional(v.string()), // Add this line
    tags: v.optional(v.array(v.string())), // Add this line
  },
  handler: async (ctx, { name, companyId, members, createdBy, teamLeaderId, description, status, tags }) => {
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
      description, // Add this line
      status, // Add this line
      tags, // Add this line
    });

    // Update users with the new teamId
    for (const memberId of members) {
      await ctx.db.patch(memberId, { teamId });
      
      // Create activity for each member added
      await createActivityForUser(ctx, {
        userId: memberId,
        actionType: "Added to Team",
        targetId: teamId,
        targetType: "team",
        description: `Added to newly created team "${name}"`,
        metadata: {
          addedBy: createdBy,
          teamId,
        },
      });
    }

    // Create team creation activity (moved outside the loop)
    await createActivityForUser(ctx, {
      userId: createdBy,
      actionType: "Created Team",
      targetId: teamId,
      targetType: "team",
      description: `New team "${name}" created with ${members.length} initial members`,
      metadata: {
        teamId,
        memberCount: members.length,
      },
    });

    return teamId;
  },
});

export const updateTeam = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.optional(v.string()),
    members: v.optional(v.array(v.id("users"))),
    teamLeaderId: v.optional(v.id("users")),
    description: v.optional(v.string()), // Add this line
    status: v.optional(v.string()), // Add this line
    tags: v.optional(v.array(v.string())), // Add this line
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

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
      ...(args.description && { description: args.description }), // Add this line
      ...(args.status && { status: args.status }), // Add this line
      ...(args.tags && { tags: args.tags }), // Add this line
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

    // Create activity for team update
    const updatedFields = Object.keys(args).filter((key): key is keyof typeof args => {
      return key !== 'teamId' && args[key as keyof typeof args] !== undefined;
    });
    await createActivityForUser(ctx, {
      userId,
      actionType: "Updated Team",
      targetId: args.teamId,
      targetType: "team",
      description: `Updated team ${team.name} (${updatedFields.join(', ')})`,
      metadata: {
        teamId: args.teamId,
        updatedFields,
        previousValues: {
          name: team.name,
          teamLeaderId: team.teamLeaderId,
          description: team.description,
          status: team.status,
        },
      },
    });

    // If members were updated, create activities for added/removed members
    if (args.members) {
      const addedMembers = args.members.filter(id => !team.members.includes(id));
      const removedMembers = team.members.filter(id => !args.members?.includes(id));

      // Activities for added members
      for (const memberId of addedMembers) {
        await createActivityForUser(ctx, {
          userId: memberId,
          actionType: "Added to Team",
          targetId: args.teamId,
          targetType: "team",
          description: `Added to team ${team.name}`,
          metadata: {
            addedBy: userId,
            teamId: args.teamId,
          },
        });
      }

      // Activities for removed members
      for (const memberId of removedMembers) {
        await createActivityForUser(ctx, {
          userId: memberId,
          actionType: "Removed from Team",
          targetId: args.teamId,
          targetType: "team",
          description: `Removed from team ${team.name}`,
          metadata: {
            removedBy: userId,
            teamId: args.teamId,
          },
        });
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
    // Get the authenticated user ID
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated. Please log in to perform this action.");
    }

    // Get the current user
    const currentUser = await ctx.db.get(userId);
    if (!currentUser) {
      throw new Error("Your user account could not be found. Please contact support.");
    }

    // Get the team
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found. It may have been deleted.");
    }

    // Validate that all member IDs exist
    for (const memberId of args.memberIds) {
      const member = await ctx.db.get(memberId);
      if (!member) {
        throw new Error(`User with ID ${memberId} not found`);
      }
    }

    // Add the members to the team (avoiding duplicates)
    const updatedMembers = [...new Set([...team.members, ...args.memberIds])];
    await ctx.db.patch(args.teamId, {
      members: updatedMembers,
    });

    // Update users with the team ID
    for (const memberId of args.memberIds) {
      await ctx.db.patch(memberId, { teamId: args.teamId });

      // Create recent activity for each added member
      await createActivityForUser(ctx, {
        userId: memberId,
        actionType: "Added to Team",
        targetId: args.teamId,
        targetType: "team",
        description: `Added to team ${team.name}`,
        metadata: {
          addedBy: currentUser._id,
          teamId: args.teamId,
        },
      });
    }

    // Create recent activity for the user who added the members
    await createActivityForUser(ctx, {
      userId: currentUser._id,
      actionType: "Added Team Members",
      targetId: args.teamId,
      targetType: "team",
      description: `Added ${args.memberIds.length} members to team ${team.name}`,
      metadata: {
        teamId: args.teamId,
        memberIds: args.memberIds,
      },
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
    const currentUser = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), identity.email))
      .first();
    if (!currentUser) throw new Error("User not found");

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    // Check if user is the creator
    if (team.createdBy !== currentUser._id) {
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

    // Clear teamId for removed members and create activities
    for (const memberId of memberIdsToRemove) {
      await ctx.db.patch(memberId, { teamId: undefined });

      // Create recent activity for each removed member
      await createActivityForUser(ctx, {
        userId: memberId,
        actionType: "Removed from Team",
        targetId: args.teamId,
        targetType: "team",
        description: `Removed from team ${team.name}`,
        metadata: {
          removedBy: currentUser._id,
          teamId: args.teamId,
        },
      });
    }

    // Create recent activity for the user who removed the members
    await createActivityForUser(ctx, {
      userId: currentUser._id,
      actionType: "Removed Team Members",
      targetId: args.teamId,
      targetType: "team",
      description: `Removed ${memberIdsToRemove.length} members from team ${team.name}`,
      metadata: {
        teamId: args.teamId,
        memberIds: memberIdsToRemove,
      },
    });

    return { success: true, message: "Members removed successfully" };
  },
});

// Delete a team
export const deleteTeam = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    // Clear teamId for all members of the team and create activities
    for (const memberId of team.members) {
      await ctx.db.patch(memberId, { teamId: undefined });

      // Create activity for each member
      await createActivityForUser(ctx, {
        userId: memberId,
        actionType: "Team Deleted",
        targetId: args.teamId,
        targetType: "team",
        description: `Team "${team.name}" was deleted`,
        metadata: {
          deletedBy: userId,
          teamId: args.teamId,
        },
      });
    }

    // Create activity for the user who deleted the team
    await createActivityForUser(ctx, {
      userId,
      actionType: "Deleted Team",
      targetId: args.teamId,
      targetType: "team",
      description: `Deleted team "${team.name}"`,
      metadata: {
        teamId: args.teamId,
        memberCount: team.members.length,
      },
    });

    await ctx.db.delete(args.teamId);
    return { success: true, message: "Team deleted successfully" };
  },
});

export const bulkDeleteTeams = mutation({
  args: {
    teamIds: v.array(v.id("teams")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

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
        const team = await ctx.db.get(teamId);
        if (!team) {
          errors.push(`Team with ID ${teamId} not found`);
          continue;
        }

        // Clear teamId for all members and create activities
        for (const memberId of team.members) {
          await ctx.db.patch(memberId, { teamId: undefined });

          await createActivityForUser(ctx, {
            userId: memberId,
            actionType: "Team Deleted",
            targetId: teamId,
            targetType: "team",
            description: `Team "${team.name}" was deleted`,
            metadata: {
              deletedBy: userId,
              teamId: teamId,
            },
          });
        }

        // Create activity for the bulk delete operation
        await createActivityForUser(ctx, {
          userId,
          actionType: "Deleted Team",
          targetId: teamId,
          targetType: "team",
          description: `Deleted team "${team.name}" as part of bulk deletion`,
          metadata: {
            teamId: teamId,
            memberCount: team.members.length,
            bulkOperation: true,
          },
        });

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
