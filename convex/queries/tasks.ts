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

    // Fetch subtasks for all tasks
    const taskIds = tasks.map(task => task._id);
    const allSubtasks = taskIds.length > 0
      ? await Promise.all(
        taskIds.map(taskId =>
          ctx.db
            .query("subtasks")
            .withIndex("taskId", (q) => q.eq("taskId", taskId))
            .order("asc") // Order by position
            .collect()
        )
      )
      : [];

    // Create a map of task IDs to their subtasks
    const subtasksMap = new Map(
      taskIds.map((taskId, index) => [taskId, allSubtasks[index] || []])
    );

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

    // Enhance tasks with assignee details and subtasks
    return tasks.map(task => ({
      ...task,
      assigneeDetails: task.assigneeId ? userMap.get(task.assigneeId) : null,
      subtasks: subtasksMap.get(task._id) || []
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

    // Fetch subtasks for this task
    const subtasks = await ctx.db
      .query("subtasks")
      .withIndex("taskId", (q) => q.eq("taskId", args.taskId))
      .order("asc") // Order by position
      .collect();

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
      subtasks,
      projectDetails,
      assigneeDetails,
      creatorDetails,
      completerDetails
    };
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

    // Fetch subtasks for all tasks
    const taskIds = tasks.map(task => task._id);
    const allSubtasks = taskIds.length > 0
      ? await Promise.all(
        taskIds.map(taskId =>
          ctx.db
            .query("subtasks")
            .withIndex("taskId", (q) => q.eq("taskId", taskId))
            .order("asc") // Order by position
            .collect()
        )
      )
      : [];

    // Create a map of task IDs to their subtasks
    const subtasksMap = new Map(
      taskIds.map((taskId, index) => [taskId, allSubtasks[index] || []])
    );

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

    // Return tasks with project details and subtasks
    return tasks.map(task => ({
      ...task,
      projectDetails: projectMap.get(task.projectId),
      subtasks: subtasksMap.get(task._id) || []
    }));
  },
});

export const fetchOverdueTasks = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    // Set `now` to start of today (00:00:00) to avoid marking today's tasks as overdue
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStart = now.getTime();

    // Get tasks assigned to the user that are overdue and not completed
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("assigneeId", (q) => q.eq("assigneeId", userId))
      .filter((q) =>
        q.and(
          q.lt(q.field("dueDate"), todayStart),
          q.neq(q.field("status"), "completed")
        )
      )
      .collect();

    // Fetch subtasks for all tasks
    const taskIds = tasks.map(task => task._id);
    const allSubtasks = taskIds.length > 0
      ? await Promise.all(
        taskIds.map(taskId =>
          ctx.db
            .query("subtasks")
            .withIndex("taskId", (q) => q.eq("taskId", taskId))
            .order("asc") // Order by position
            .collect()
        )
      )
      : [];

    // Create a map of task IDs to their subtasks
    const subtasksMap = new Map(
      taskIds.map((taskId, index) => [taskId, allSubtasks[index] || []])
    );

    // Fetch project details
    const projectIds = [...new Set(tasks.map((task) => task.projectId))];

    const projects = await Promise.all(
      projectIds.map((id) => ctx.db.get(id))
    );

    const projectMap = new Map(
      projects
        .filter((project) => project !== null)
        .map((project) => [project!._id, project])
    );

    // Return tasks with project details and subtasks
    return tasks.map((task) => ({
      ...task,
      projectDetails: projectMap.get(task.projectId),
      subtasks: subtasksMap.get(task._id) || []
    }));
  },
});

export const fetchTodaysTasks = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - 1;

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("assigneeId", (q) => q.eq("assigneeId", userId))
      .filter(q =>
        q.and(
          q.gte(q.field("dueDate"), startOfDay),
          q.lte(q.field("dueDate"), endOfDay),
          q.neq(q.field("status"), "completed")
        )
      )
      .collect();

    // Fetch subtasks for all tasks
    const taskIds = tasks.map(task => task._id);
    const allSubtasks = taskIds.length > 0
      ? await Promise.all(
        taskIds.map(taskId =>
          ctx.db
            .query("subtasks")
            .withIndex("taskId", (q) => q.eq("taskId", taskId))
            .order("asc") // Order by position
            .collect()
        )
      )
      : [];

    // Create a map of task IDs to their subtasks
    const subtasksMap = new Map(
      taskIds.map((taskId, index) => [taskId, allSubtasks[index] || []])
    );

    const projectIds = [...new Set(tasks.map(task => task.projectId))];

    const projects = await Promise.all(
      projectIds.map(id => ctx.db.get(id))
    );

    const projectMap = new Map(
      projects
        .filter(project => project !== null)
        .map(project => [project!._id, project])
    );

    return tasks.map(task => ({
      ...task,
      projectDetails: projectMap.get(task.projectId),
      subtasks: subtasksMap.get(task._id) || []
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

    // Fetch subtasks for all tasks
    const taskIds = tasks.map(task => task._id);
    const allSubtasks = taskIds.length > 0
      ? await Promise.all(
        taskIds.map(taskId =>
          ctx.db
            .query("subtasks")
            .withIndex("taskId", (q) => q.eq("taskId", taskId))
            .order("asc")
            .collect()
        )
      )
      : [];

    // Create a map of task IDs to their subtasks
    const subtaskMap = new Map();
    allSubtasks.forEach((subtasks, index) => {
      subtaskMap.set(taskIds[index], subtasks.sort((a, b) => a.position - b.position));
    });

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

    // Enhance tasks with assignee, project details, and subtasks
    return tasks.map(task => ({
      ...task,
      assigneeDetails: task.assigneeId ? userMap.get(task.assigneeId) : null,
      projectDetails: projectMap.get(task.projectId) || null,
      subtasks: subtaskMap.get(task._id) || []
    }));
  },
});

export const fetchAllTasksByAssignee = query({
  args: {
    assigneeId: v.id("users"),
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
  },
  handler: async (ctx, args) => {
    const { assigneeId, status, priority } = args;

    // Start with base query for tasks assigned to this user
    let tasksQuery = ctx.db
      .query("tasks")
      .withIndex("assigneeId", (q) => q.eq("assigneeId", assigneeId));

    // Apply optional filters
    if (status) {
      tasksQuery = tasksQuery.filter(q => q.eq(q.field("status"), status));
    }

    if (priority) {
      tasksQuery = tasksQuery.filter(q => q.eq(q.field("priority"), priority));
    }

    const tasks = await tasksQuery.collect();

    // Fetch subtasks for all tasks
    const taskIds = tasks.map(task => task._id);
    const allSubtasks = taskIds.length > 0
      ? await Promise.all(
        taskIds.map(taskId =>
          ctx.db
            .query("subtasks")
            .withIndex("taskId", (q) => q.eq("taskId", taskId))
            .order("asc")
            .collect()
        )
      )
      : [];

    // Create a map of task IDs to their subtasks
    const subtaskMap = new Map();
    allSubtasks.forEach((subtasks, index) => {
      subtaskMap.set(taskIds[index], subtasks.sort((a, b) => a.position - b.position));
    });

    // Get unique project IDs from tasks
    const projectIds = [...new Set(tasks.map(task => task.projectId))];

    // Fetch all related projects
    const projects = await Promise.all(
      projectIds.map(id => ctx.db.get(id))
    );

    // Create a project map for easy lookup
    const projectMap = new Map(
      projects.filter(p => p !== null).map(p => [p!._id, p])
    );

    // Fetch assignee details (just the current user in this case)
    const assignee = await ctx.db.get(assigneeId);

    return tasks.map(task => ({
      ...task,
      projectDetails: projectMap.get(task.projectId) || null,
      assigneeDetails: assignee || null,
      subtasks: subtaskMap.get(task._id) || []
    }));
  },
});
export const fetchTasksByAssignee = query({
  args: {
    assigneeId: v.id("users"),
    projectId: v.id("projects"),
    status: v.optional(v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("on_hold"),
      v.literal("canceled")
    )),
  },
  handler: async (ctx, args) => {
    const { assigneeId, projectId, status } = args;

    let tasksQuery = ctx.db
      .query("tasks")
      .withIndex("assigneeId", (q) => q.eq("assigneeId", assigneeId));

    // Filter by projectId
    tasksQuery = tasksQuery.filter(q => q.eq(q.field("projectId"), projectId));

    if (status) {
      tasksQuery = tasksQuery.filter(q => q.eq(q.field("status"), status));
    }

    const tasks = await tasksQuery.collect();

    // Fetch subtasks for all tasks
    const taskIds = tasks.map(task => task._id);
    const allSubtasks = taskIds.length > 0
      ? await Promise.all(
        taskIds.map(taskId =>
          ctx.db
            .query("subtasks")
            .withIndex("taskId", (q) => q.eq("taskId", taskId))
            .order("asc") // Order by position
            .collect()
        )
      )
      : [];

    // Create a map of task IDs to their subtasks
    const subtasksMap = new Map(
      taskIds.map((taskId, index) => [taskId, allSubtasks[index] || []])
    );

    // Fetch project details
    const project = await ctx.db.get(projectId);

    // Fetch assignee details
    const assignee = await ctx.db.get(assigneeId);

    return tasks.map(task => ({
      ...task,
      assignee: assignee || null,
      projectDetails: project || null,
      subtasks: subtasksMap.get(task._id) || []
    }));
  },
});


// Fetch all subtasks for a specific assignee
export const fetchAllSubtasksByAssignee = query({
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

    // First, get all tasks assigned to this user
    let tasksQuery = ctx.db
      .query("tasks")
      .withIndex("assigneeId", (q) => q.eq("assigneeId", assigneeId));

    const tasks = await tasksQuery.collect();
    const taskIds = tasks.map(task => task._id);

    if (taskIds.length === 0) {
      return [];
    }

    // Get all subtasks for these tasks
    const allSubtasks = await Promise.all(
      taskIds.map(taskId =>
        ctx.db
          .query("subtasks")
          .withIndex("taskId", (q) => q.eq("taskId", taskId))
          .collect()
      )
    );

    // Flatten the subtasks array
    let subtasks = allSubtasks.flat();

    // Apply status filter if provided
    if (status) {
      subtasks = subtasks.filter(subtask => subtask.status === status);
    }

    // Create maps for quick lookup
    const taskMap = new Map(tasks.map(task => [task._id, task]));

    // Get unique project IDs from tasks
    const projectIds = [...new Set(tasks.map(task => task.projectId))];
    const projects = await Promise.all(
      projectIds.map(id => ctx.db.get(id))
    );
    const projectMap = new Map(
      projects.filter(p => p !== null).map(p => [p!._id, p])
    );

    // Fetch assignee details
    const assignee = await ctx.db.get(assigneeId);

    return subtasks
      .sort((a, b) => a.position - b.position)
      .map(subtask => {
        const parentTask = taskMap.get(subtask.taskId);
        return {
          ...subtask,
          parentTask: parentTask || null,
          projectDetails: parentTask ? projectMap.get(parentTask.projectId) || null : null,
          assigneeDetails: assignee || null,
        };
      });
  },
});

// Fetch subtasks by assignee and project - THIS IS THE MISSING QUERY
export const fetchSubtasksByAssigneeAndProject = query({
  args: {
    assigneeId: v.id("users"),
    projectId: v.id("projects"),
    status: v.optional(v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("on_hold"),
      v.literal("canceled")
    )),
  },
  handler: async (ctx, args) => {
    const { assigneeId, projectId, status } = args;

    // Get all tasks assigned to this user in the specific project
    let tasksQuery = ctx.db
      .query("tasks")
      .withIndex("assigneeId", (q) => q.eq("assigneeId", assigneeId))
      .filter(q => q.eq(q.field("projectId"), projectId));

    const tasks = await tasksQuery.collect();
    const taskIds = tasks.map(task => task._id);

    if (taskIds.length === 0) {
      return [];
    }

    // Get all subtasks for these tasks
    const allSubtasks = await Promise.all(
      taskIds.map(taskId =>
        ctx.db
          .query("subtasks")
          .withIndex("taskId", (q) => q.eq("taskId", taskId))
          .collect()
      )
    );

    // Flatten the subtasks array
    let subtasks = allSubtasks.flat();

    // Apply status filter if provided
    if (status) {
      subtasks = subtasks.filter(subtask => subtask.status === status);
    }

    // Create task map for quick lookup
    const taskMap = new Map(tasks.map(task => [task._id, task]));

    // Fetch project and assignee details
    const project = await ctx.db.get(projectId);
    const assignee = await ctx.db.get(assigneeId);

    return subtasks
      .sort((a, b) => a.position - b.position)
      .map(subtask => {
        const parentTask = taskMap.get(subtask.taskId);
        return {
          ...subtask,
          parentTask: parentTask || null,
          projectDetails: project || null,
          assigneeDetails: assignee || null,
        };
      });
  },
});

// Helper query to fetch subtasks by specific task
export const fetchSubtasksByTaskId = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const { taskId } = args;

    const subtasks = await ctx.db
      .query("subtasks")
      .withIndex("taskId", (q) => q.eq("taskId", taskId))
      .collect();

    // Sort by position to maintain order
    return subtasks.sort((a, b) => a.position - b.position);
  },
});

// Fetch a single subtask by ID
export const getSubtaskById = query({
  args: { subtaskId: v.id("subtasks") },
  handler: async (ctx, args) => {
    const subtask = await ctx.db.get(args.subtaskId);

    if (!subtask) {
      return null;
    }

    // Fetch parent task details
    const parentTask = await ctx.db.get(subtask.taskId);
    
    // Fetch project details through parent task
    const projectDetails = parentTask?.projectId ? await ctx.db.get(parentTask.projectId) : null;

    // Fetch creator details
    const creatorDetails = await ctx.db.get(subtask.createdBy);

    // Fetch completer details if available
    let completerDetails = null;
    if (subtask.completedBy) {
      completerDetails = await ctx.db.get(subtask.completedBy);
    }

    return {
      ...subtask,
      parentTask,
      projectDetails,
      creatorDetails,
      completerDetails
    };
  },
});