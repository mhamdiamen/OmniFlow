import { query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// Fetch all projects for a company
export const fetchProjectsByCompany = query({
  args: { 
    companyId: v.id("companies"),
    category: v.optional(v.string()),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    )),
    healthStatus: v.optional(v.union(
      v.literal("on_track"),
      v.literal("at_risk"),
      v.literal("off_track")
    )),
  },
  handler: async (ctx, args) => {
    const { companyId, category, priority, healthStatus } = args;
    
    // Start with the base query
    let projectsQuery = ctx.db
      .query("projects")
      .withIndex("companyId", (q) => q.eq("companyId", companyId));
    
    // Apply filters if provided
    if (category) {
      projectsQuery = projectsQuery.filter(q => q.eq(q.field("category"), category));
    }
    
    if (priority) {
      projectsQuery = projectsQuery.filter(q => q.eq(q.field("priority"), priority));
    }
    
    if (healthStatus) {
      projectsQuery = projectsQuery.filter(q => q.eq(q.field("healthStatus"), healthStatus));
    }
    
    const projects = await projectsQuery.collect();

    // Fetch all creators in one batch
    const creatorIds = [...new Set(projects.map(project => project.createdBy))];
    const creators = await Promise.all(creatorIds.map(id => ctx.db.get(id)));
    const creatorMap = new Map(
      creators
        .filter((user) => user !== null)
        .map(user => [user!._id, user])
    );

    // Fetch all teams in one batch
    const teamIds = [...new Set(projects
      .map(project => project.teamId)
      .filter((id): id is Id<"teams"> => id !== undefined))];
    
    const teams = await Promise.all(teamIds.map(id => ctx.db.get(id)));
    const teamMap = new Map(
      teams
        .filter((team) => team !== null)
        .map(team => [team!._id, team])
    );

    return projects.map(project => ({
      ...project,
      creatorDetails: creatorMap.get(project.createdBy) ? {
        _id: project.createdBy,
        name: creatorMap.get(project.createdBy)?.name || "N/A",
        email: creatorMap.get(project.createdBy)?.email || "",
        image: creatorMap.get(project.createdBy)?.image,
      } : null,
      teamDetails: project.teamId && teamMap.get(project.teamId) ? {
        _id: project.teamId,
        name: teamMap.get(project.teamId)?.name || "N/A",
      } : null,
    }));
  },
});

// Fetch projects by team ID
export const fetchProjectsByTeam = query({
  args: { 
    teamId: v.id("teams"),
    category: v.optional(v.string()),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    )),
    healthStatus: v.optional(v.union(
      v.literal("on_track"),
      v.literal("at_risk"),
      v.literal("off_track")
    )),
  },
  handler: async (ctx, args) => {
    const { teamId, category, priority, healthStatus } = args;
    
    // Start with the base query
    let projectsQuery = ctx.db
      .query("projects")
      .withIndex("teamId", (q) => q.eq("teamId", teamId));
    
    // Apply filters if provided
    if (category) {
      projectsQuery = projectsQuery.filter(q => q.eq(q.field("category"), category));
    }
    
    if (priority) {
      projectsQuery = projectsQuery.filter(q => q.eq(q.field("priority"), priority));
    }
    
    if (healthStatus) {
      projectsQuery = projectsQuery.filter(q => q.eq(q.field("healthStatus"), healthStatus));
    }
    
    const projects = await projectsQuery.collect();

    // Fetch all creators in one batch
    const creatorIds = [...new Set(projects.map(project => project.createdBy))];
    const creators = await Promise.all(creatorIds.map(id => ctx.db.get(id)));
    const creatorMap = new Map(
      creators
        .filter((user) => user !== null)
        .map(user => [user!._id, user])
    );

    return projects.map(project => ({
      ...project,
      creatorDetails: creatorMap.get(project.createdBy) ? {
        _id: project.createdBy,
        name: creatorMap.get(project.createdBy)?.name || "N/A",
        email: creatorMap.get(project.createdBy)?.email || "",
        image: creatorMap.get(project.createdBy)?.image,
      } : null,
    }));
  },
});

// Add this query to your existing projects.ts file

// Fetch a single project by ID
export const getProjectById = query({
  args: { 
    projectId: v.id("projects")
  },
  handler: async (ctx, args) => {
    const { projectId } = args;
    
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }
    
    return project;
  },
});
