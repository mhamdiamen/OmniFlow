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
    createdAt: v.float64(),
    lastLogin: v.optional(v.float64()),
  })
    .index("email", ["email"])
    .index("companyId", ["companyId"]),

  companies: defineTable({
    name: v.string(),
    ownerId: v.string(),
    createdAt: v.float64(),
    modules: v.array(v.string()),
    settings: v.optional(v.any()),
  }).index("ownerId", ["ownerId"]),

  modules: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    isActiveByDefault: v.boolean(),
    permissions: v.array(v.string()),
  }),

  company_modules: defineTable({
    companyId: v.string(),
    moduleId: v.string(),
    activatedBy: v.string(),
    activatedAt: v.float64(),
  }).index("companyId", ["companyId", "moduleId"]),

  roles: defineTable({
    companyId: v.optional(v.string()),
    name: v.string(),
    permissions: v.array(v.string()),
  }).index("companyId", ["companyId"]),

  permissions: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
  }),
});

export default schema;
