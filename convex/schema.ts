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
    lastLogin: v.optional(v.float64()),
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
    // Core invitation data
    email: v.string(),
    token: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("expired")
    ),

    // Company and role association
    companyId: v.id("companies"),
    roleId: v.id("roles"),

    // Inviter and timestamps
    invitedBy: v.id("users"),
    invitedAt: v.float64(),
    expiresAt: v.float64(),

    // Metadata for tracking
    acceptedAt: v.optional(v.float64()),
    rejectedAt: v.optional(v.float64()),
    metadata: v.optional(v.any()), // For custom permissions or notes
  })
    .index("email", ["email"]) // For looking up invitations by email
    .index("token", ["token"]) // For secure invitation acceptance
    .index("companyId", ["companyId"]) // For company-specific invitations
    .index("status", ["status"]) // For filtering by status
    .index("expiresAt", ["expiresAt"]), // For cleaning up expired invitations

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

});

export default schema;
