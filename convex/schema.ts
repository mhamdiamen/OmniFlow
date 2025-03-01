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
    teamId: v.optional(v.id("teams")), // Add team association

    lastLogin: v.optional(v.float64()),
    // Professional Profile Fields
    quote: v.optional(v.string()), // User's personal quote

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

    // New fields:
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

    // New Enhancements
    category: v.optional(v.string()),       // Category of the module (e.g., "Finance")
    activationCount: v.optional(v.int64()), // How many companies activated this module
    releaseNotes: v.optional(v.string()),   // Notes for module updates & changes
  })
    .index("slug", ["slug"])
    .index("category", ["category"])
    .index("activationCount", ["activationCount"]),

  // Updated company_modules table:
  company_modules: defineTable({
    companyId: v.id("companies"),   // Now references the companies table.
    moduleId: v.id("modules"),      // Already updated.
    activatedBy: v.id("users"),     // Now references the users table.
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
    email: v.string(), // User's email
    token: v.string(), // Unique invitation token
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("expired")
    ), // Invitation status
    companyId: v.id("companies"), // Admin's company ID
    invitedBy: v.id("users"), // Admin's user ID
    invitedAt: v.float64(), // Timestamp of invitation
    expiresAt: v.float64(), // Expiration timestamp
    acceptedAt: v.optional(v.number()), // Add this line

  })
    .index("email", ["email"]) // Index for looking up invitations by email
    .index("token", ["token"]) // Index for secure invitation acceptance
    .index("status", ["status"]) // Index for filtering by status
    .index("expiresAt", ["expiresAt"]), // Index for cleaning up expired invitations


  notifications: defineTable({
    userId: v.id("users"), // The user who should receive the notification
    image: v.string(), // URL to the user's avatar
    user: v.string(), // Name of the user who triggered the notification
    action: v.string(), // Action performed (e.g., "requested review")
    target: v.string(), // Target of the action (e.g., "PR #42")
    timestamp: v.string(), // Timestamp of the notification
    unread: v.boolean(), // Whether the notification is unread
  })
    .index("userId", ["userId"]) // Index by user ID for faster queries
    .index("unread", ["userId", "unread"]), // Index by unread status for faster queries

  teams: defineTable({
    name: v.string(),
    companyId: v.id("companies"),
    createdBy: v.id("users"),
    createdAt: v.float64(),
    members: v.array(v.id("users")), // Array of user IDs in the team
  })
    .index("companyId", ["companyId"])
    .index("createdBy", ["createdBy"]),

});

export default schema;
