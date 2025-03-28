import { query } from "../_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "../_generated/dataModel";

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
    
    // Get team leader IDs, filtering out undefined values
    const leaderIds = [...new Set(teams.map((team) => team.teamLeaderId).filter((id): id is Id<"users"> => id !== undefined))];

    // Fetch all users in one batch
    const allUserIds = [...new Set([...memberIds, ...creatorIds, ...leaderIds])];
    const users = await Promise.all(allUserIds.map(id => ctx.db.get(id)));
    const userMap = new Map(
      users
        .filter((user): user is NonNullable<typeof user> => user !== null)
        .map(user => [user._id, user])
    );

    // Fetch invitations for this company to get "invited by" information
    const invitations = await ctx.db
      .query("invitations")
      .filter((q) => q.eq(q.field("companyId"), companyId))
      .collect();

    // Create a map of email to invitation for quick lookup
    const invitationsByEmail = new Map();
    for (const invitation of invitations) {
      if (!invitationsByEmail.has(invitation.email)) {
        invitationsByEmail.set(invitation.email, []);
      }
      invitationsByEmail.get(invitation.email).push(invitation);
    }

    return teams.map((team) => {
      // Get the creator details
      const creator = userMap.get(team.createdBy);
      
      return {
        ...team,
        memberDetails: team.members
          .map(memberId => {
            const member = userMap.get(memberId);
            if (!member) return null;
            
            // Find invitation for this member by email
            const memberInvitations = member.email ? invitationsByEmail.get(member.email) : [];
            const latestInvitation = memberInvitations && memberInvitations.length > 0 
              ? memberInvitations.sort((a: Doc<"invitations">, b: Doc<"invitations">) => b._creationTime - a._creationTime)[0] 
              : null;
            
            // Get inviter details if available
            const invitedBy = latestInvitation && latestInvitation.invitedBy 
              ? userMap.get(latestInvitation.invitedBy) 
              : null;
            
            return {
              _id: member._id,
              name: member.name || "N/A",
              email: member.email,
              image: member.image,
              invitedBy: invitedBy ? {
                _id: invitedBy._id,
                name: invitedBy.name || "N/A",
                email: invitedBy.email,
                image: invitedBy.image,
              } : null,
            };
          })
          .filter((member): member is NonNullable<typeof member> => member !== null),
        creatorName: creator ? creator.name || "N/A" : "System",
        creatorDetails: creator ? {
          _id: creator._id,
          name: creator.name || "N/A",
          email: creator.email,
          image: creator.image,
        } : null,
        teamLeaderDetails: team.teamLeaderId ? {
          _id: team.teamLeaderId,
          name: userMap.get(team.teamLeaderId)?.name || "N/A",
          email: userMap.get(team.teamLeaderId)?.email || "",
          image: userMap.get(team.teamLeaderId)?.image,
          phone: userMap.get(team.teamLeaderId)?.phone, // Add phone here
        } : null,
        memberCount: team.members.length,
        description: team.description, // Add this line
        status: team.status, // Add this line
        tags: team.tags, // Add this line
      };
    });
  },
});

// Fetch a single team by ID with full details
export const fetchTeamById = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    const team = await ctx.db.get(teamId);
    if (!team) return null;

    // Fetch all users (members and creator) in one batch
    const userIds = [...team.members];
    if (team.createdBy) userIds.push(team.createdBy);
    if (team.teamLeaderId) userIds.push(team.teamLeaderId);
    
    const uniqueUserIds = [...new Set(userIds)];
    const users = await Promise.all(uniqueUserIds.map(id => ctx.db.get(id)));
    const userMap = new Map(
      users
        .filter((user): user is NonNullable<typeof user> => user !== null)
        .map(user => [user._id, user])
    );

    // Get the creator details
    const creator = userMap.get(team.createdBy);

    // Fetch invitations for this team's company to get "invited by" information
    const invitations = team.companyId ? await ctx.db
      .query("invitations")
      .filter((q) => q.eq(q.field("companyId"), team.companyId))
      .collect()
      : [];

    // Create a map of email to invitation for quick lookup
    const invitationsByEmail = new Map();
    for (const invitation of invitations) {
      if (!invitationsByEmail.has(invitation.email)) {
        invitationsByEmail.set(invitation.email, []);
      }
      invitationsByEmail.get(invitation.email).push(invitation);
    }

    return {
      ...team,
      memberDetails: team.members
        .map(memberId => {
          const member = userMap.get(memberId);
          if (!member) return null;
          
          // Find invitation for this member by email
          const memberInvitations = member.email ? invitationsByEmail.get(member.email) : [];
          const latestInvitation = memberInvitations && memberInvitations.length > 0 
            ? memberInvitations.sort((a: Doc<"invitations">, b: Doc<"invitations">) => b._creationTime - a._creationTime)[0] 
            : null;
          
          // Get inviter details if available
          const invitedBy = latestInvitation && latestInvitation.invitedBy 
            ? userMap.get(latestInvitation.invitedBy) 
            : null;
          
          return {
            _id: member._id,
            name: member.name || "N/A",
            email: member.email,
            image: member.image,
            invitedBy: invitedBy ? {
              _id: invitedBy._id,
              name: invitedBy.name || "N/A",
              email: invitedBy.email,
              image: invitedBy.image,
            } : null,
          };
        })
        .filter((member): member is NonNullable<typeof member> => member !== null),
      creatorName: creator ? creator.name || "N/A" : "System",
      creatorDetails: creator ? {
        _id: creator._id,
        name: creator.name || "N/A",
        email: creator.email,
        image: creator.image,
      } : null,
      teamLeaderDetails: team.teamLeaderId ? {
        _id: team.teamLeaderId,
        name: userMap.get(team.teamLeaderId)?.name || "N/A",
        email: userMap.get(team.teamLeaderId)?.email || "",
        image: userMap.get(team.teamLeaderId)?.image,
        phone: userMap.get(team.teamLeaderId)?.phone, // Add phone here
      } : null,
      memberCount: team.members.length,
      description: team.description, // Add this line
      status: team.status, // Add this line
      tags: team.tags, // Add this line
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

// Add this function to the existing teams.ts file

// Fetch team with associated projects
export const fetchTeamWithProjects = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    const team = await ctx.db.get(teamId);
    if (!team) return null;

    // Fetch all projects for this team
    const projects = await ctx.db
      .query("projects")
      .withIndex("teamId", (q) => q.eq("teamId", teamId))
      .collect();

    // Fetch all users (members and creator) in one batch
    const userIds = [...team.members];
    if (team.createdBy) userIds.push(team.createdBy);
    if (team.teamLeaderId) userIds.push(team.teamLeaderId);
    
    const uniqueUserIds = [...new Set(userIds)];
    const users = await Promise.all(uniqueUserIds.map(id => ctx.db.get(id)));
    const userMap = new Map(
      users
        .filter((user) => user !== null)
        .map(user => [user!._id, user])
    );

    // Get the creator details
    const creator = team.createdBy ? userMap.get(team.createdBy) : null;

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
        .filter((member) => member !== null),
      creatorName: creator ? creator.name || "N/A" : "System",
      creatorDetails: creator ? {
        _id: creator._id,
        name: creator.name || "N/A",
        email: creator.email,
        image: creator.image,
      } : null,
      teamLeaderDetails: team.teamLeaderId && userMap.get(team.teamLeaderId) ? {
        _id: team.teamLeaderId,
        name: userMap.get(team.teamLeaderId)?.name || "N/A",
        email: userMap.get(team.teamLeaderId)?.email || "",
        image: userMap.get(team.teamLeaderId)?.image,
      } : null,
      memberCount: team.members.length,
      projects: projects.map(project => ({
        _id: project._id,
        name: project.name,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
      })),
      projectCount: projects.length,
    };
  },
});
// Fetch team members by project ID
export const fetchTeamMembersByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    // First, get the project to find the associated team
    const project = await ctx.db.get(projectId);
    if (!project || !project.teamId) return [];
    
    // Get the team
    const team = await ctx.db.get(project.teamId);
    if (!team) return [];
    
    // Fetch all team members
    const members = await Promise.all(
      team.members.map(async (memberId) => {
        const user = await ctx.db.get(memberId);
        if (!user) return null;
        
        return {
          _id: user._id,
          name: user.name || user.email,
          email: user.email,
          image: user.image
        };
      })
    );
    
    // Filter out null values and return
    return members.filter((member): member is NonNullable<typeof member> => member !== null);
  },
});