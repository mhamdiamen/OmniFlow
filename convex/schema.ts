import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  // Users table definition
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.float64()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.float64()),
    isAnonymous: v.optional(v.boolean()),

    /*
     * must be optional because OAuth providers don't return a role
     */
    role: v.optional(
      v.union(v.literal("read"), v.literal("write"), v.literal("admin"))
    ),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),


  // Stories table definition
  stories: defineTable({
    title: v.string(), // Story title
    description: v.optional(v.string()), // Optional description
    genre: v.array(v.string()), // Array of genres/tags
    status: v.union(
      v.literal("Ongoing"),
      v.literal("Completed"),
      v.literal("Abandoned")
    ), // Story status
    isPrivate: v.boolean(), // Privacy setting
    rules: v.optional(v.array(v.string())), // Changed to array of strings
    creator: v.id("users"), // Updated to Id<"users">
    followers: v.array(v.id("users")), // Updated to Id<"users">
    liked: v.array(v.id("users")), // Add this line
    bookmarked: v.array(v.id("users")), // Add this line
    createdAt: v.string(), // Creation timestamp
    updatedAt: v.string(), // Update timestamp
    chapterCount: v.optional(v.int64()), // Optional chapter count as int64
    lastUpdated: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")), // Add this line for file storage
  }).index("by_creator", ["creator"]), // Index for querying stories by creator

  chapters: defineTable({
    storyId: v.id("stories"), // Story ID reference
    chapterTitle: v.string(), // Title of the chapter
    content: v.string(), // Chapter content
    author: v.id("users"), // Author ID reference
    createdAt: v.string(), // Creation timestamp
    updatedAt: v.string(), // Update timestamp
    wordCount: v.optional(v.int64()), // Word count of the chapter
    isDraft: v.optional(v.boolean()), // Whether the chapter is a draft
  })
    .index("by_story", ["storyId"]) // Index for querying chapters by story
    .index("by_author", ["author"]), // Index for querying chapters by author

    
});




export default schema;
