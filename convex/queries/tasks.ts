import { query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// Fetch all tasks for a specific project
export const fetchTasksByProject = query({
  args: { 
    projectId: v.id("projects"),
    status: v.optional(v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("on_hold"),
      v.literal("canceled")
    )),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
    assigneeId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { projectId, status, priority, assigneeId } = args;
    
    // Start with the base query
    let tasksQuery = ctx.db
      .query("tasks")
      .withIndex("projectId", (q) => q.eq("projectId", projectId));
    
    // Apply filters if provided
    if (status) {
      tasksQuery = tasksQuery.filter(q => q.eq(q.field("status"), status));
    }
    
    if (priority) {
      tasksQuery = tasksQuery.filter(q => q.eq(q.field("priority"), priority));
    }
    
    if (assigneeId) {
      tasksQuery = tasksQuery.filter(q => q.eq(q.field("assigneeId"), assigneeId));
    }
    
    // Execute the query and get the tasks
    const tasks = await tasksQuery.collect();
    
    // Fetch assignee details for each task
    const assigneeIds = tasks
      .map(task => task.assigneeId)
      .filter((id): id is Id<"users"> => id !== undefined);
    
    const uniqueAssigneeIds = [...new Set(assigneeIds)];
    
    // Fetch user details for assignees
    const users = uniqueAssigneeIds.length > 0 
      ? await Promise.all(
          uniqueAssigneeIds.map(id => ctx.db.get(id))
        )
      : [];
    
    // Create a map of user IDs to user details
    const userMap = new Map(
      users
        .filter(user => user !== null)
        .map(user => [user!._id, user])
    );
    
    // Enhance tasks with assignee details
    return tasks.map(task => ({
      ...task,
      assigneeDetails: task.assigneeId ? userMap.get(task.assigneeId) : null
    }));
  },
});

// Fetch a single task by ID
export const getTaskById = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    
    if (!task) {
      return null;
    }
    
    // Fetch project details
    const projectDetails = task.projectId ? await ctx.db.get(task.projectId) : null;
    
    // Fetch assignee details if available
    let assigneeDetails = null;
    if (task.assigneeId) {
      assigneeDetails = await ctx.db.get(task.assigneeId);
    }
    
    // Fetch creator details
    const creatorDetails = await ctx.db.get(task.createdBy);
    
    // Fetch completer details if available
    let completerDetails = null;
    if (task.completedBy) {
      completerDetails = await ctx.db.get(task.completedBy);
    }
    
    return {
      ...task,
      projectDetails,
      assigneeDetails,
      creatorDetails,
      completerDetails
    };
  },
});

// Fetch tasks assigned to a specific user
export const fetchTasksByAssignee = query({
  args: { 
    assigneeId: v.id("users"),
    status: v.optional(v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("on_hold"),
      v.literal("canceled")
    )),
  },
  handler: async (ctx, args) => {
    const { assigneeId, status } = args;
    
    let tasksQuery = ctx.db
      .query("tasks")
      .withIndex("assigneeId", (q) => q.eq("assigneeId", assigneeId));
    
    if (status) {
      tasksQuery = tasksQuery.filter(q => q.eq(q.field("status"), status));
    }
    
    const tasks = await tasksQuery.collect();
    
    // Fetch project details for each task
    const projectIds = [...new Set(tasks.map(task => task.projectId))];
    
    const projects = await Promise.all(
      projectIds.map(id => ctx.db.get(id))
    );
    
    const projectMap = new Map(
      projects
        .filter(project => project !== null)
        .map(project => [project!._id, project])
    );
    
    // Return tasks with project details
    return tasks.map(task => ({
      ...task,
      projectDetails: projectMap.get(task.projectId)
    }));
  },
});

// Fetch upcoming tasks (due soon)
export const fetchUpcomingTasks = query({
  args: { 
    userId: v.id("users"),
    daysAhead: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, daysAhead = 7 } = args;
    
    // Calculate the date range
    const now = Date.now();
    const futureDate = now + (daysAhead * 24 * 60 * 60 * 1000);
    
    // Get tasks assigned to the user with due dates in the range
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("assigneeId", (q) => q.eq("assigneeId", userId))
      .filter(q => 
        q.and(
          q.lt(q.field("dueDate"), futureDate),
          q.gt(q.field("dueDate"), now)
        )
      )
      .filter(q => q.neq(q.field("status"), "completed"))
      .collect();
    
    // Fetch project details
    const projectIds = [...new Set(tasks.map(task => task.projectId))];
    
    const projects = await Promise.all(
      projectIds.map(id => ctx.db.get(id))
    );
    
    const projectMap = new Map(
      projects
        .filter(project => project !== null)
        .map(project => [project!._id, project])
    );
    
    // Return tasks with project details
    return tasks.map(task => ({
      ...task,
      projectDetails: projectMap.get(task.projectId)
    }));
  },
});

// Fetch all tasks for a company
export const fetchAllTasks = query({
  args: { 
    companyId: v.id("companies"),
    status: v.optional(v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("on_hold"),
      v.literal("canceled")
    )),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
    assigneeId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { companyId, status, priority, assigneeId } = args;
    
    // Get all projects for the company
    const projects = await ctx.db
      .query("projects")
      .withIndex("companyId", (q) => q.eq("companyId", companyId))
      .collect();
    
    const projectIds = projects.map(project => project._id);
    
    if (projectIds.length === 0) {
      return [];
    }
    
    // Start with a base query for all tasks
    let tasksQuery = ctx.db.query("tasks");
    
    // Filter for tasks that belong to any of the company's projects
    // Using an OR condition instead of the 'in' operator
    tasksQuery = tasksQuery.filter(q => 
      q.or(...projectIds.map(id => q.eq(q.field("projectId"), id)))
    );
    
    // Apply filters if provided
    if (status) {
      tasksQuery = tasksQuery.filter(q => q.eq(q.field("status"), status));
    }
    
    if (priority) {
      tasksQuery = tasksQuery.filter(q => q.eq(q.field("priority"), priority));
    }
    
    if (assigneeId) {
      tasksQuery = tasksQuery.filter(q => q.eq(q.field("assigneeId"), assigneeId));
    }
    
    // Execute the query and get the tasks
    const tasks = await tasksQuery.collect();
    
    // Fetch assignee details for each task
    const assigneeIds = tasks
      .map(task => task.assigneeId)
      .filter((id): id is Id<"users"> => id !== undefined);
    
    const uniqueAssigneeIds = [...new Set(assigneeIds)];
    
    // Fetch user details for assignees
    const users = uniqueAssigneeIds.length > 0 
      ? await Promise.all(
          uniqueAssigneeIds.map(id => ctx.db.get(id))
        )
      : [];
    
    // Create a map of user IDs to user details
    const userMap = new Map(
      users
        .filter(user => user !== null)
        .map(user => [user!._id, user])
    );
    
    // Fetch project details for each task
    const projectMap = new Map(
      projects.map(project => [project._id, project])
    );
    
    // Enhance tasks with assignee and project details
    return tasks.map(task => ({
      ...task,
      assigneeDetails: task.assigneeId ? userMap.get(task.assigneeId) : null,
      projectDetails: projectMap.get(task.projectId) || null
    }));
  },
});