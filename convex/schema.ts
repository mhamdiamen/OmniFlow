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
    slug: v.string(),         // New field: used as fallback for building URLs
    customRoute: v.string(),  // New field: dedicated route for the module
    permissions: v.array(v.id("permissions")),
  }),

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
});

export default schema;
