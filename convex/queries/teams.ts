import { query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// Fetch all teams for a company with member details
export const fetchTeamsByCompany = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, { companyId }) => {
    const teams = await ctx.db
      .query("teams")
      .withIndex("companyId", (q) => q.eq("companyId", companyId))
      .collect();

    // Get all unique member IDs from all teams
    const memberIds = [...new Set(teams.flatMap((team) => team.members))];
    
    // Get creator IDs, filtering out undefined values
    const creatorIds = [...new Set(teams.map((team) => team.createdBy).filter((id): id is Id<"users"> => id !== undefined))];

    // Fetch all users in one batch
    const users = await Promise.all([...memberIds, ...creatorIds].map(id => ctx.db.get(id)));
    const userMap = new Map(
      users
        .filter((user): user is NonNullable<typeof user> => user !== null)
        .map(user => [user._id, user])
    );

    return teams.map((team) => ({
      ...team,
      memberDetails: team.members
        .map(memberId => {
          const member = userMap.get(memberId);
          if (!member) return null;
          return {
            _id: member._id,
            name: member.name || "N/A",
            email: member.email,
            image: member.image,
          };
        })
        .filter((member): member is NonNullable<typeof member> => member !== null),
      creatorName: team.createdBy ? userMap.get(team.createdBy)?.name || "N/A" : "System",
      memberCount: team.members.length,
    }));
  },
});

// Fetch a single team by ID with full details
export const fetchTeamById = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    const team = await ctx.db.get(teamId);
    if (!team) return null;

    // Fetch all users (members and creator) in one batch
    const userIds = [...team.members, team.createdBy];
    const users = await Promise.all(userIds.map(id => ctx.db.get(id)));
    const userMap = new Map(
      users
        .filter((user): user is NonNullable<typeof user> => user !== null)
        .map(user => [user._id, user])
    );

    return {
      ...team,
      memberDetails: team.members
        .map(memberId => {
          const member = userMap.get(memberId);
          if (!member) return null;
          return {
            _id: member._id,
            name: member.name || "N/A",
            email: member.email,
            image: member.image,
          };
        })
        .filter((member): member is NonNullable<typeof member> => member !== null),
      creatorName: userMap.get(team.createdBy)?.name || "N/A",
      memberCount: team.members.length,
    };
  },
});

// Fetch teams that a user is a member of
export const fetchUserTeams = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const teams = await ctx.db
      .query("teams")
      .filter((q) => 
        q.or(
          q.eq(q.field("createdBy"), userId),
          q.eq(q.field("members"), [userId])
        )
      )
      .collect();

    // Fetch all creators in one batch
    const creatorIds = [...new Set(teams.map(team => team.createdBy))];
    const creators = await Promise.all(creatorIds.map(id => ctx.db.get(id)));
    const creatorMap = new Map(
      creators
        .filter((user): user is NonNullable<typeof user> => user !== null)
        .map(user => [user._id, user])
    );

    return teams.map(team => ({
      ...team,
      creatorName: creatorMap.get(team.createdBy)?.name || "N/A",
      memberCount: team.members.length,
    }));
  },
});
