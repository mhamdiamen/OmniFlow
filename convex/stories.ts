import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { checkPermission, VALID_ROLES } from "./lib/permissions";
import { Id } from "./_generated/dataModel";

export const getStories = query({
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("User must be authenticated.");

        /* const hasAccess = await checkPermission(ctx, userId, VALID_ROLES.WRITE); */
        /* if (!hasAccess) throw new ConvexError("Insufficient permissions."); */

        const stories = await ctx.db.query("stories").collect();
        const storiesWithUsers = await Promise.all(
            stories.map(async (story) => {
                const user = await ctx.db.get(story.creator);
                let fileUrl = null;

                try {
                    if (story.storageId) {
                        fileUrl = await ctx.storage.getUrl(story.storageId);
                    }
                } catch (error) {
                    console.error("Failed to fetch image URL for story:", story._id, error);
                }

                return {
                    ...story,
                    user: {
                        avatar: user?.image || "",
                        name: user?.name || "Unknown",
                    },
                    fileUrl,
                };
            })
        );

        return storiesWithUsers.map((story) => ({
            ...story,
            chapterCount: story.chapterCount ? Number(story.chapterCount) : undefined,
        }));
    },
});
// Query: Get stories by the current user (WRITE permission required)
export const getCurrentUserStories = query({
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("User must be authenticated.");

        /* const hasAccess = await checkPermission(ctx, userId, VALID_ROLES.WRITE); */
        /* if (!hasAccess) throw new ConvexError("Insufficient permissions."); */

        // Fetch user details
        const user = await ctx.db.get(userId);
        if (!user) throw new ConvexError("User not found.");

        // Fetch stories created by the current user
        const stories = await ctx.db
            .query("stories")
            .withIndex("by_creator", (q) => q.eq("creator", userId))
            .collect();

        // Add the user's name to each story and convert chapterCount
        return stories.map((story) => ({
            ...story,
            creatorName: user.name ?? "Unknown",
            chapterCount: story.chapterCount ? Number(story.chapterCount) : undefined, // Convert bigint to number
        }));
    },
});




// Mutation: Create a new story (WRITE permission required)
export const createStory = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        genre: v.array(v.string()),
        isPrivate: v.optional(v.boolean()),
        rules: v.optional(v.array(v.string())), // Changed to array of strings
        status: v.union(v.literal("Ongoing"), v.literal("Completed"), v.literal("Abandoned")),
        storageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("User must be authenticated.");

        /* const hasAccess = await checkPermission(ctx, userId, VALID_ROLES.WRITE); */
        /* if (!hasAccess) throw new ConvexError("Insufficient permissions."); */

        const story = {
            title: args.title,
            description: args.description ?? "No Description",
            genre: args.genre,
            status: args.status ?? "Ongoing",
            isPrivate: args.isPrivate ?? false,
            rules: args.rules ?? [], // Default to an empty array
            creator: userId as Id<"users">,
            followers: [] as Id<"users">[],
            liked: [] as Id<"users">[], // Initialize liked as an empty array
            bookmarked: [] as Id<"users">[], // Initialize bookmarked as an empty array
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            storageId: args.storageId,
        };

        return await ctx.db.insert("stories", story);
    },
});

export const updateStory = mutation({
    args: {
        id: v.id("stories"), // Required for identifying the document
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        genre: v.optional(v.array(v.string())),
        isPrivate: v.optional(v.boolean()),
        rules: v.optional(v.array(v.string())), // Changed to array of strings
        status: v.optional(v.union(v.literal("Ongoing"), v.literal("Completed"), v.literal("Abandoned"))),
        storageId: v.optional(v.id("_storage")), // Add this line for file storage
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("User must be authenticated.");

        const { id, ...updates } = args; // Separate `id` from the fields to be updated

        const story = await ctx.db.get(id);
        if (!story) throw new ConvexError("Story not found.");
        if (story.creator !== userId) throw new ConvexError("You do not have permission to update this story.");

        /* const hasAccess = await checkPermission(ctx, userId, VALID_ROLES.WRITE); */
        /* if (!hasAccess) throw new ConvexError("Insufficient permissions."); */

        // Patch the story document without including `id`
        await ctx.db.patch(id, {
            ...updates,
            updatedAt: new Date().toISOString(),
        });

        return { success: true };
    },
});

export const removeStoryById = mutation({
    args: { id: v.id("stories") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("User must be authenticated.");

        const story = await ctx.db.get(args.id);
        if (!story) throw new ConvexError("Story not found.");

        /* const hasAccess = await checkPermission(ctx, userId, VALID_ROLES.WRITE); */
        /* if (!hasAccess) throw new ConvexError("Insufficient permissions."); */

        // Delete the associated image if it exists
        if (story.storageId) {
            await ctx.storage.delete(story.storageId); // Delete the image from storage
        }

        // Delete all chapters of the story
        const chapters = await ctx.db
            .query("chapters")
            .withIndex("by_story", (q) => q.eq("storyId", args.id))
            .collect();

        for (const chapter of chapters) {
            await ctx.db.delete(chapter._id);
        }

        // Delete the story
        await ctx.db.delete(args.id);

        return { success: true, deletedChaptersCount: chapters.length };
    },
});
// Mutation: Delete one or multiple stories (ADMIN permission required)
export const removeStories = mutation({
    args: {
        ids: v.array(v.id("stories")), // Array of story IDs to delete
    },
    handler: async (ctx, { ids }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("User must be authenticated.");

        /* const hasAccess = await checkPermission(ctx, userId, VALID_ROLES.WRITE); */
        /* if (!hasAccess) throw new ConvexError("Insufficient permissions."); */

        // Fetch stories to delete
        const stories = await ctx.db
            .query("stories")
            .filter((q) => q.or(...ids.map((id) => q.eq(q.field("_id"), id))))
            .collect();

        if (stories.length !== ids.length) {
            throw new ConvexError("Some stories not found or you do not have access.");
        }

        for (const story of stories) {
            // Delete the associated image if it exists
            if (story.storageId) {
                await ctx.storage.delete(story.storageId); // Delete the image from storage
            }

            // Delete all chapters of the story
            const chapters = await ctx.db
                .query("chapters")
                .withIndex("by_story", (q) => q.eq("storyId", story._id))
                .collect();

            for (const chapter of chapters) {
                await ctx.db.delete(chapter._id);
            }

            // Delete the story
            await ctx.db.delete(story._id);
        }

        return { success: true, deletedCount: stories.length };
    },
});



// Query: Get a story by ID (WRITE permission required)
export const getStoryById = query({
    args: { id: v.id("stories") },
    handler: async (ctx, { id }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("User must be authenticated.");

        /* const hasAccess = await checkPermission(ctx, userId, VALID_ROLES.WRITE); */
        /* if (!hasAccess) throw new ConvexError("Insufficient permissions."); */

        const story = await ctx.db.get(id);
        if (!story) throw new ConvexError("Story not found.");
        return story;
    },
});

export const getImageUrl = query({
    args: { storageId: v.union(v.id("_storage"), v.null()) }, // Allow storageId to be null
    handler: async (ctx, { storageId }) => {
        if (!storageId) return null; // Return null if storageId is null
        const url = await ctx.storage.getUrl(storageId);
        return url;
    },
});

export const toggleFollowStory = mutation({
    args: {
        storyId: v.id("stories"), // storyId is of type Id<"stories">
    },
    handler: async (ctx, { storyId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("User must be authenticated.");

        const story = await ctx.db.get(storyId);
        if (!story) throw new ConvexError("Story not found.");

        const isFollowing = story.followers.includes(userId);

        if (isFollowing) {
            // Remove the user from the followers array
            await ctx.db.patch(storyId, {
                followers: story.followers.filter((follower) => follower !== userId),
            });
        } else {
            // Add the user to the followers array
            await ctx.db.patch(storyId, {
                followers: [...story.followers, userId],
            });
        }

        return { success: true, isFollowing: !isFollowing };
    },
});
export const toggleLikeStory = mutation({
    args: {
        storyId: v.id("stories"),
    },
    handler: async (ctx, { storyId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("User must be authenticated.");

        const story = await ctx.db.get(storyId);
        if (!story) throw new ConvexError("Story not found.");

        const isLiked = story.liked.includes(userId);

        if (isLiked) {
            // Remove the user from the liked array
            await ctx.db.patch(storyId, {
                liked: story.liked.filter((user) => user !== userId),
            });
        } else {
            // Add the user to the liked array
            await ctx.db.patch(storyId, {
                liked: [...story.liked, userId],
            });
        }

        return { success: true, isLiked: !isLiked };
    },
});

export const toggleBookmarkStory = mutation({
    args: {
        storyId: v.id("stories"),
    },
    handler: async (ctx, { storyId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("User must be authenticated.");

        const story = await ctx.db.get(storyId);
        if (!story) throw new ConvexError("Story not found.");

        const isBookmarked = story.bookmarked.includes(userId);

        if (isBookmarked) {
            // Remove the user from the bookmarked array
            await ctx.db.patch(storyId, {
                bookmarked: story.bookmarked.filter((user) => user !== userId),
            });
        } else {
            // Add the user to the bookmarked array
            await ctx.db.patch(storyId, {
                bookmarked: [...story.bookmarked, userId],
            });
        }

        return { success: true, isBookmarked: !isBookmarked }; // Ensure this is returned
    },
});

export const isUserFollowingStory = query({
    args: {
        storyId: v.id("stories"), // storyId is of type Id<"stories">
    },
    handler: async (ctx, { storyId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return false;

        const story = await ctx.db.get(storyId);
        if (!story) throw new ConvexError("Story not found.");

        return story.followers.includes(userId);
    },
});

export const isUserLikedStory = query({
    args: {
        storyId: v.id("stories"),
    },
    handler: async (ctx, { storyId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return false;

        const story = await ctx.db.get(storyId);
        if (!story) throw new ConvexError("Story not found.");

        return story.liked.includes(userId);
    },
});

export const isUserBookmarkedStory = query({
    args: {
        storyId: v.id("stories"),
    },
    handler: async (ctx, { storyId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return false;

        const story = await ctx.db.get(storyId);
        if (!story) throw new ConvexError("Story not found.");

        return story.bookmarked.includes(userId);
    },
});