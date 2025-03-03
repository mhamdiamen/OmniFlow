import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.string(),
    emailVerificationTime: v.optional(v.float64()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.float64()),
    companyId: v.optional(v.string()),
    roleId: v.optional(v.string()),
    teamId: v.optional(v.id("teams")),
    lastLogin: v.optional(v.float64()),
    quote: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    department: v.optional(v.string()),
    bio: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    certifications: v.optional(v.array(v.string())),
    experience: v.optional(v.array(v.object({
      title: v.string(),
      company: v.string(),
      startDate: v.float64(),
      endDate: v.optional(v.float64()),
      description: v.optional(v.string()),
    }))),
    education: v.optional(v.array(v.object({
      institution: v.string(),
      degree: v.string(),
      fieldOfStudy: v.string(),
      startDate: v.float64(),
      endDate: v.optional(v.float64()),
    }))),
    socialLinks: v.optional(v.object({
      linkedin: v.optional(v.string()),
      twitter: v.optional(v.string()),
      github: v.optional(v.string()),
    })),
  })
    .index("email", ["email"])
    .index("companyId", ["companyId"]),

  companies: defineTable({
    name: v.string(),
    ownerId: v.string(),
    createdAt: v.float64(),
    modules: v.array(v.id("modules")),
    settings: v.optional(v.any()),
    logoUrl: v.optional(v.string()),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(
      v.object({
        street: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        zip: v.optional(v.string()),
        country: v.optional(v.string()),
      })
    ),
    industry: v.optional(v.string()),
    size: v.optional(v.string()),
    socialLinks: v.optional(
      v.object({
        facebook: v.optional(v.string()),
        twitter: v.optional(v.string()),
        linkedin: v.optional(v.string()),
      })
    ),
  }).index("ownerId", ["ownerId"]),

  modules: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    isActiveByDefault: v.boolean(),
    slug: v.string(),
    customRoute: v.string(),
    permissions: v.array(v.id("permissions")),
    category: v.optional(v.string()),
    activationCount: v.optional(v.int64()),
    releaseNotes: v.optional(v.string()),
  })
    .index("slug", ["slug"])
    .index("category", ["category"])
    .index("activationCount", ["activationCount"]),

  company_modules: defineTable({
    companyId: v.id("companies"),
    moduleId: v.id("modules"),
    activatedBy: v.id("users"),
    activatedAt: v.float64(),
  }).index("companyId", ["companyId", "moduleId"]),

  roles: defineTable({
    companyId: v.optional(v.array(v.string())),
    name: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.id("permissions")),
  })
    .index("companyId", ["companyId"])
    .index("name", ["name"]),

  permissions: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    assignedRoles: v.array(v.id("roles")),
    assignedModules: v.array(v.id("modules")),
  }),

  invitations: defineTable({
    email: v.string(),
    token: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("expired")
    ),
    companyId: v.id("companies"),
    invitedBy: v.id("users"),
    invitedAt: v.float64(),
    expiresAt: v.float64(),
    acceptedAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("token", ["token"])
    .index("status", ["status"])
    .index("expiresAt", ["expiresAt"]),

  notifications: defineTable({
    userId: v.id("users"),
    image: v.string(),
    user: v.string(),
    action: v.string(),
    target: v.string(),
    timestamp: v.string(),
    unread: v.boolean(),
  })
    .index("userId", ["userId"])
    .index("unread", ["userId", "unread"]),

  teams: defineTable({
    name: v.string(),
    companyId: v.id("companies"),
    createdBy: v.id("users"),
    createdAt: v.float64(),
    members: v.array(v.id("users")),
    teamLeaderId: v.optional(v.id("users")),
  })
    .index("companyId", ["companyId"])
    .index("createdBy", ["createdBy"]),

  projects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    companyId: v.id("companies"),
    teamId: v.optional(v.id("teams")),
    projectId: v.optional(v.id("projects")), // Make projectId optional
    status: v.union(
      v.literal("planned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("on_hold"),
      v.literal("canceled")
    ),
    startDate: v.float64(),
    endDate: v.optional(v.float64()),
    createdBy: v.id("users"),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.optional(v.float64()),
  })
    .index("companyId", ["companyId"])
    .index("teamId", ["teamId"])
    .index("status", ["status"]),

  tasks: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    assigneeId: v.optional(v.id("users")),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("on_hold"),
      v.literal("canceled")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    dueDate: v.optional(v.float64()),
    createdBy: v.id("users"),
    completedAt: v.optional(v.float64()),
    completedBy: v.optional(v.id("users")),
  })
    .index("projectId", ["projectId"])
    .index("assigneeId", ["assigneeId"])
    .index("status", ["status"])
    .index("dueDate", ["dueDate"]),

  milestones: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    dueDate: v.float64(),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("overdue")
    ),
    createdBy: v.id("users"),
    completedAt: v.optional(v.float64()),
    completedBy: v.optional(v.id("users")),
  })
    .index("projectId", ["projectId"])
    .index("status", ["status"])
    .index("dueDate", ["dueDate"]),
});


export default schema;
