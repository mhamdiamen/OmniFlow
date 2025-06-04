import { query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// Fetch a single comment by its ID
export const getCommentById = query({
    args: {
        commentId: v.id("comments"),
    },
    handler: async (ctx, args) => {
        const { commentId } = args;

        const comment = await ctx.db.get(commentId);
        if (!comment) return null;

        // Fetch author details
        const author = await ctx.db.get(comment.authorId);

        // Fetch parent comment if exists
        let parentComment = null;
        if (comment.parentId) {
            parentComment = await ctx.db.get(comment.parentId);
        }

        return {
            ...comment,
            authorDetails: author ? {
                _id: comment.authorId,
                name: author.name || "Unknown",
                email: author.email || "",
                image: author.image || null,
            } : null,
            parentComment: parentComment ? {
                _id: parentComment._id,
                body: parentComment.body,
                authorId: parentComment.authorId,
            } : null,
        };
    },
});
// Fetch comments by target (targetId + targetType)
export const getCommentsByTarget = query({
    args: {
        targetId: v.string(),
        targetType: v.string(),
    },
    handler: async (ctx, args) => {
        const { targetId, targetType } = args;

        // Fetch only top-level comments
        const parentComments = await ctx.db
            .query("comments")
            .withIndex("by_target_and_parent", (q) =>
                q
                    .eq("targetId", targetId)
                    .eq("targetType", targetType)
                    .eq("parentId", undefined)
            )
            .collect();

        // Helper function to recursively count replies
        const countNestedReplies = async (parentId: Id<"comments">): Promise<number> => {
            const directReplies = await ctx.db
                .query("comments")
                .withIndex("parent", (q) => q.eq("parentId", parentId))
                .collect();

            let total = directReplies.length;

            for (const reply of directReplies) {
                total += await countNestedReplies(reply._id);
            }

            return total;
        };

        // Process each top-level comment
        const enrichedComments = await Promise.all(
            parentComments.map(async (comment) => {
                const replyCount = await countNestedReplies(comment._id);
                return { ...comment, replyCount };
            })
        );

        // Batch load authors
        const authorIds = [...new Set(enrichedComments.map((c) => c.authorId))];
        const authors = await Promise.all(authorIds.map((id) => ctx.db.get(id)));
        const authorMap = new Map(authors.map((a) => [a?._id, a]));

        return enrichedComments.map((comment) => ({
            ...comment,
            authorDetails: authorMap.get(comment.authorId) ? {
                _id: comment.authorId,
                name: authorMap.get(comment.authorId)?.name || "N/A",
                email: authorMap.get(comment.authorId)?.email || "",
                image: authorMap.get(comment.authorId)?.image,
            } : null,
        }));
    },
});
// Fetch replies to a specific comment
export const getRepliesToComment = query({
    args: {
      parentId: v.id("comments"),
    },
    handler: async (ctx, args) => {
      const directReplies = await ctx.db
        .query("comments")
        .withIndex("parent", (q) => q.eq("parentId", args.parentId))
        .collect();
  
      const repliesWithDetails = await Promise.all(
        directReplies.map(async (comment) => {
          const author = await ctx.db.get(comment.authorId);
          return {
            ...comment,
            authorDetails: author
              ? {
                  _id: author._id,
                  name: author.name || "N/A",       // Ensure it's a string
                  email: author.email || "",         // Ensure it's a string
                  image: author.image,               // This can be undefined
                }
              : null,
          };
        })
      );
  
      return {
        replies: repliesWithDetails,
      };
    },
  });
  
   
// Fetch all comments made by a specific user
export const getCommentsByAuthor = query({
    args: {
        authorId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const { authorId } = args;

        const comments = await ctx.db
            .query("comments")
            .withIndex("author", (q) => q.eq("authorId", authorId))
            .collect();

        // Batch load targets (projects/tasks/etc)
        const targetIds = [...new Set(comments.map((c) => c.targetId))];
        const targets = new Map();

        for (const targetId of targetIds) {
            // ❗ FIX: Use `as Id<"projects">` only if you're sure the string is a valid project ID
            const project = await ctx.db.get(targetId as Id<"projects">);
            if (project) {
                targets.set(targetId, { type: "project", data: project });
                continue;
            }
            // You can add more targetType lookups here as needed
        }

        // Batch load parent comments
        const parentIdSet = new Set(
            comments.filter((c) => c.parentId !== undefined).map((c) => c.parentId!)
        );
        const parentComments = parentIdSet.size > 0
            ? await Promise.all([...parentIdSet].map((id) => ctx.db.get(id)))
            : [];
        const parentMap = new Map(parentComments.map((c) => [c?._id, c]));

        return comments.map((comment) => ({
            ...comment,
            targetDetails: targets.get(comment.targetId) || null,
            parentComment: comment.parentId && parentMap.get(comment.parentId)
                ? {
                    _id: comment.parentId,
                    body: parentMap.get(comment.parentId)?.body,
                    authorId: parentMap.get(comment.parentId)?.authorId,
                }
                : null,
        }));
    },
});
