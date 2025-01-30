import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { checkPermission, VALID_ROLES } from "./lib/permissions";
import { Id } from "./_generated/dataModel";

// Query: Get all chapters for a story (WRITE permission required)
export const getChaptersByStory = query({
    args: { storyId: v.id("stories") },
    handler: async (ctx, { storyId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("User must be authenticated.");

        const hasAccess = await checkPermission(ctx, userId, VALID_ROLES.WRITE);
        if (!hasAccess) throw new ConvexError("Insufficient permissions.");

        // Fetch chapters by story ID and join with users table to get author names
        const chapters = await ctx.db
            .query("chapters")
            .withIndex("by_story", (q) => q.eq("storyId", storyId))
            .collect();

        return Promise.all(
            chapters.map(async (chapter) => {
                const author = await ctx.db.get(chapter.author);
                return {
                    ...chapter,
                    authorName: author?.name || "Anonymous", // Include author's name
                };
            })
        );
    },
});

// Query: Get all chapters by the current user (WRITE permission required)
export const getUserChapters = query({
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("User must be authenticated.");

        const hasAccess = await checkPermission(ctx, userId, VALID_ROLES.WRITE);
        if (!hasAccess) throw new ConvexError("Insufficient permissions.");

        // Fetch chapters authored by the current user
        return await ctx.db
            .query("chapters")
            .withIndex("by_author", (q) => q.eq("author", userId))
            .collect();
    },
});

export const getChapterById = query({
    args: { id: v.id("chapters") },
    handler: async (ctx, { id }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("User must be authenticated.");

        const hasAccess = await checkPermission(ctx, userId, VALID_ROLES.READ);
        if (!hasAccess) throw new ConvexError("Insufficient permissions.");

        const chapter = await ctx.db.get(id);
        if (!chapter) throw new ConvexError("Chapter not found.");

        return chapter;
    },
});


export const getEnrichedChapters = query({
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("User must be authenticated.");

        const hasAccess = await checkPermission(ctx, userId, VALID_ROLES.WRITE);
        if (!hasAccess) throw new ConvexError("Insufficient permissions.");

        // Fetch only chapters authored by the current user
        const chapters = await ctx.db
            .query("chapters")
            .withIndex("by_author", (q) => q.eq("author", userId))
            .collect();

        return Promise.all(
            chapters.map(async (chapter) => {
                const story = await ctx.db.get(chapter.storyId);
                const author = await ctx.db.get(chapter.author);

                return {
                    _id: chapter._id,
                    chapterTitle: chapter.chapterTitle || "Untitled", // Include chapter title
                    content: chapter.content,
                    createdAt: chapter.createdAt,
                    updatedAt: chapter.updatedAt,
                    wordCount: chapter.wordCount || 0, // Include word count (default to 0 if missing)
                    isDraft: chapter.isDraft || false, // Include draft status (default to false if missing)
                    storyTitle: story?.title || "Unknown",
                    authorName: author?.name || "Anonymous",
                };
            })
        );
    },
});


// Mutation: Add a new chapter (WRITE permission required)
export const addChapter = mutation({
    args: {
        storyId: v.id("stories"),
        chapterTitle: v.string(), // New argument for the chapter title
        content: v.string(),
        isDraft: v.optional(v.boolean()), // Optional argument for draft status
    },
    handler: async (ctx, { storyId, chapterTitle, content, isDraft }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("User must be authenticated.");

        const hasAccess = await checkPermission(ctx, userId, VALID_ROLES.WRITE);
        if (!hasAccess) throw new ConvexError("Insufficient permissions.");

        // Ensure the story exists
        const story = await ctx.db.get(storyId);
        if (!story) throw new ConvexError("Story not found.");

        // Calculate word count and convert it to bigint
        const wordCount = BigInt(content.trim().split(/\s+/).length);

        // Insert the chapter
        const chapter = {
            storyId,
            chapterTitle,
            content,
            author: userId as Id<"users">,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            wordCount,
            isDraft: isDraft || false,
        };
        const insertedChapterId = await ctx.db.insert("chapters", chapter);

        // Update story's chapterCount and lastUpdated fields
        const newChapterCount = (story.chapterCount || BigInt(0)) + BigInt(1); // Use BigInt for addition
        await ctx.db.patch(storyId, {
            chapterCount: newChapterCount,
            lastUpdated: new Date().toISOString(),
        });

        return { ...chapter, _id: insertedChapterId };
    },
});



// Mutation: Update a chapter (WRITE permission required)
export const updateChapter = mutation({
    args: {
        id: v.id("chapters"), // ID of the chapter to update
        chapterTitle: v.optional(v.string()), // Optional argument to update the title
        content: v.optional(v.string()), // Optional argument to update the content
        isDraft: v.optional(v.boolean()), // Optional argument to update draft status
        storyId: v.optional(v.id("stories")), // Optional argument to validate story association
    },
    handler: async (ctx, { id, chapterTitle, content, isDraft, storyId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("User must be authenticated.");

        const chapter = await ctx.db.get(id);
        if (!chapter) throw new ConvexError("Chapter not found.");
        if (chapter.author !== userId)
            throw new ConvexError("You do not have permission to update this chapter.");

        const hasAccess = await checkPermission(ctx, userId, VALID_ROLES.WRITE);
        if (!hasAccess) throw new ConvexError("Insufficient permissions.");

        // Validate the new storyId if provided
        if (storyId && storyId !== chapter.storyId) {
            const story = await ctx.db.get(storyId);
            if (!story) throw new ConvexError("Provided story does not exist.");
        }

        // Calculate new word count if content is updated
        let updatedFields: any = { updatedAt: new Date().toISOString() };

        if (content !== undefined) {
            updatedFields.content = content;
            updatedFields.wordCount = BigInt(content.trim().split(/\s+/).length);
        }

        if (chapterTitle !== undefined) {
            updatedFields.chapterTitle = chapterTitle;
        }

        if (isDraft !== undefined) {
            updatedFields.isDraft = isDraft;
        }

        if (storyId !== undefined && storyId !== chapter.storyId) {
            updatedFields.storyId = storyId;
        }

        // Update chapter in the database
        await ctx.db.patch(id, updatedFields);

        return { success: true, updatedFields };
    },
});


export const deleteChapter = mutation({
    args: { id: v.id("chapters") },
    handler: async (ctx, { id }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("User must be authenticated.");

        const chapter = await ctx.db.get(id);
        if (!chapter) throw new ConvexError("Chapter not found.");

        const storyId = chapter.storyId;

        const story = await ctx.db.get(storyId);
        if (!story) throw new ConvexError("Story not found.");

        const hasAccess = await checkPermission(ctx, userId, VALID_ROLES.WRITE);
        if (!hasAccess) throw new ConvexError("Insufficient permissions.");

        // Delete the chapter
        await ctx.db.delete(id);

        // Update story's chapterCount and lastUpdated fields
        const newChapterCount = (story.chapterCount || BigInt(1)) - BigInt(1);
        await ctx.db.patch(storyId, {
            chapterCount: newChapterCount,
            lastUpdated: newChapterCount === BigInt(0) ? undefined : new Date().toISOString(),
        });

        return { success: true };
    },
});

export const removeChapters = mutation({
    args: { ids: v.array(v.id("chapters")) }, // Array of chapter IDs to delete
    handler: async (ctx, { ids }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("User must be authenticated.");

        const hasAccess = await checkPermission(ctx, userId, VALID_ROLES.WRITE);
        if (!hasAccess) throw new ConvexError("Insufficient permissions.");

        // Fetch chapters by IDs
        const chapters = await ctx.db
            .query("chapters")
            .filter((q) => q.or(...ids.map((id) => q.eq(q.field("_id"), id))))
            .collect();

        if (chapters.length !== ids.length) {
            throw new ConvexError("Some chapters not found or you do not have access.");
        }

        // Map to track chapter count updates for each story
        const storyUpdates: Record<string, bigint> = {};

        for (const chapter of chapters) {
            const storyId = chapter.storyId;

            // Initialize story's chapter count update if not already present
            if (!storyUpdates[storyId]) {
                storyUpdates[storyId] = BigInt(0);
            }

            // Decrement chapter count for the story
            storyUpdates[storyId] -= BigInt(1);

            // Delete the chapter
            await ctx.db.delete(chapter._id);
        }

        // Update chapter count and lastUpdated for affected stories
        for (const [storyId, delta] of Object.entries(storyUpdates)) {
            const story = await ctx.db.get(storyId as Id<"stories">);
            if (!story) continue;

            const newChapterCount = (story.chapterCount || BigInt(0)) + delta;
            const lastUpdated = newChapterCount === BigInt(0) ? undefined : new Date().toISOString();

            await ctx.db.patch(storyId as Id<"stories">, {
                chapterCount: newChapterCount,
                lastUpdated,
            });
        }

        return { success: true, deletedCount: chapters.length };
    },
});

