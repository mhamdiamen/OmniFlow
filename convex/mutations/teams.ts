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
    teamLeaderId: v.optional(v.id("users")), // Add team leader field
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
      teamLeaderId,
      createdAt: Date.now(),
    });

    return teamId;
  },
});

// Update team details
export const updateTeam = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.optional(v.string()),
    members: v.optional(v.array(v.id("users"))),
    teamLeaderId: v.optional(v.id("users")), // Add team leader field
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

    // Get the existing team
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    // Check if user is the creator or a member
    if (team.createdBy !== user._id && !team.members.includes(user._id)) {
      throw new Error("Not authorized to update this team");
    }

    // Update the team with new values, keeping existing values if not provided
    await ctx.db.patch(args.teamId, {
      ...(args.name && { name: args.name }),
      ...(args.members && { members: args.members }),
      ...(args.teamLeaderId !== undefined && { teamLeaderId: args.teamLeaderId }),
    });

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

    return { success: true, message: "Members removed successfully" };
  },
});

// Delete a team
export const deleteTeam = mutation({
  args: {
    teamId: v.id("teams"),
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

    // Only the creator can delete the team
    if (team.createdBy !== user._id) {
      throw new Error("Only team creator can delete the team");
    }

    await ctx.db.delete(args.teamId);
    return { success: true, message: "Team deleted successfully" };
  },
});
