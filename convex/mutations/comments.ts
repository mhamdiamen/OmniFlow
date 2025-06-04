import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { createActivityForUser } from "./recentActivity";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createComment = mutation({
  args: {
    authorId: v.id("users"),
    targetId: v.string(),
    targetType: v.string(),
    body: v.string(),
    parentId: v.optional(v.id("comments")),
    mentionedUserIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId || userId !== args.authorId) {
      throw new Error("Unauthorized");
    }

    const { authorId, targetId, targetType, body, parentId, mentionedUserIds } = args;

    // Parse mentions from the comment body
    const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
    let match;
    const mentionedNames = new Set<string>();
    
    while ((match = mentionRegex.exec(body)) !== null) {
      mentionedNames.add(match[1]);
    }

    // Find user IDs for mentioned names
    const mentionedUsers = await Promise.all(
      Array.from(mentionedNames).map(async (name) => {
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("name"), name))
          .first();
        return user?._id;
      })
    );

    // Combine explicit mentions with parsed mentions
    const validMentionedUserIds = mentionedUsers.filter(
      (id): id is Id<"users"> => id !== undefined
    );
    const allMentionedUserIds = [
      ...new Set([
        ...validMentionedUserIds,
        ...(mentionedUserIds || [])
      ])
    ];

    // Create the comment
    const commentId = await ctx.db.insert("comments", {
      authorId,
      targetId,
      targetType,
      body,
      parentId,
      mentionedUserIds: allMentionedUserIds,
      createdAt: Date.now(),
      reactions: {},
    });

    // Log activity
    await createActivityForUser(ctx, {
      userId: authorId,
      actionType: "Created Comment",
      targetId: commentId,
      targetType: "comment",
      description: `Comment posted on ${targetType}`,
      metadata: {
        commentId,
        targetId,
        targetType,
        bodyPreview: body.length > 50 ? `${body.substring(0, 50)}...` : body,
        parentId,
        mentionedUserCount: allMentionedUserIds.length,
        createdAt: Date.now(),
      },
    });

    return { 
      commentId, 
      message: "Comment created successfully",
      mentionedUserIds: allMentionedUserIds 
    };
  },
});

export const updateComment = mutation({
  args: {
    commentId: v.id("comments"),
    body: v.string(),
    mentionedUserIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const { commentId, body, mentionedUserIds } = args;
    const comment = await ctx.db.get(commentId);

    if (!comment || comment.authorId !== userId) {
      throw new Error("Comment not found or unauthorized");
    }

    // Parse mentions from the new body
    const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
    let match;
    const mentionedNames = new Set<string>();
    
    while ((match = mentionRegex.exec(body)) !== null) {
      if (match && match[1]) {
        mentionedNames.add(match[1]);
      }
    }

    // Find user IDs for mentioned names
    const mentionedUsers = await Promise.all(
      Array.from(mentionedNames).map(async (name) => {
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("name"), name))
          .first();
        return user?._id;
      })
    );

    // Combine explicit mentions with parsed mentions
    const validMentionedUserIds = mentionedUsers.filter(
      (id): id is Id<"users"> => id !== undefined
    );
    const allMentionedUserIds = [
      ...new Set([
        ...validMentionedUserIds,
        ...(mentionedUserIds || [])
      ])
    ];

    // Update the comment
    await ctx.db.patch(commentId, {
      body,
      mentionedUserIds: allMentionedUserIds,
      updatedAt: Date.now(),
    });

    // Create notifications for newly mentioned users (excluding the author)
    const existingMentions = new Set(comment.mentionedUserIds?.map(id => id.toString()) || []);
    const newMentions = allMentionedUserIds.filter(
      id => !existingMentions.has(id.toString()) && id.toString() !== userId.toString()
    );



    // Log activity
    await createActivityForUser(ctx, {
      userId,
      actionType: "Updated Comment",
      targetId: commentId,
      targetType: "comment",
      description: `Comment updated by user`,
      metadata: {
        commentId,
        oldBody: comment.body,
        newBody: body,
        updatedAt: Date.now(),
      },
    });

    return { commentId, message: "Comment updated successfully" };
  },
});
  export const deleteComment = mutation({
    args: {
      commentId: v.id("comments"),
    },
    handler: async (ctx, { commentId }) => {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("Unauthorized");
  
      const comment = await ctx.db.get(commentId);
      if (!comment || comment.authorId !== userId) {
        throw new Error("Comment not found or unauthorized");
      }
  
      await ctx.db.delete(commentId);
  
      // 🔔 Log activity
      await createActivityForUser(ctx, {
        userId,
        actionType: "Deleted Comment",
        targetId: commentId,
        targetType: "comment",
        description: `Comment deleted permanently`,
        metadata: {
          commentId,
          body: comment.body,
          deletedAt: Date.now(),
        },
      });
  
      return { success: true, message: "Comment deleted successfully" };
    },
  });
  export const addReactionToComment = mutation({
    args: {
      commentId: v.id("comments"),
      userId: v.id("users"),
      reaction: v.union(v.literal("heart"), v.literal("thumbs_up"), v.literal("thumbs_down")), // Use literals
    },
    handler: async (ctx, args) => {
      const authUserId = await getAuthUserId(ctx);
      if (!authUserId || authUserId !== args.userId) {
        throw new Error("Unauthorized");
      }
  
      const { commentId, userId, reaction } = args;
      const comment = await ctx.db.get(commentId);
  
      if (!comment) {
        throw new Error("Comment not found");
      }
  
      const currentReactions = comment.reactions || {};
      const usersReacting = currentReactions[reaction] || [];
  
      if (!usersReacting.includes(userId)) {
        usersReacting.push(userId);
      }
  
      const updatedReactions = {
        ...currentReactions,
        [reaction]: usersReacting,
      };
  
      await ctx.db.patch(commentId, {
        reactions: updatedReactions,
        updatedAt: Date.now(),
      });
  
      return { success: true, message: `Reaction "${reaction}" added` };
    },
  });
  export const removeReactionFromComment = mutation({
    args: {
      commentId: v.id("comments"),
      userId: v.id("users"),
      reaction: v.union(v.literal("heart"), v.literal("thumbs_up"), v.literal("thumbs_down")), // Use literals
    },
    handler: async (ctx, args) => {
      const authUserId = await getAuthUserId(ctx);
      if (!authUserId || authUserId !== args.userId) {
        throw new Error("Unauthorized");
      }
  
      const { commentId, userId, reaction } = args;
      const comment = await ctx.db.get(commentId);
  
      if (!comment) {
        throw new Error("Comment not found");
      }
  
      // Safely access reactions or default to empty object
      const currentReactions = comment.reactions || {};
      const usersReacting = currentReactions[reaction] || [];
  
      // Remove the user from the reaction list
      const updatedUsersReacting = usersReacting.filter((id) => id !== userId);
  
      // Clone the current reactions object
      const updatedReactions = { ...currentReactions };
  
      // Only update if there are changes
      if (updatedUsersReacting.length > 0) {
        // If users still reacting, keep them
        updatedReactions[reaction] = updatedUsersReacting;
      } else {
        // If no users left, delete the key entirely instead of setting it to undefined
        delete updatedReactions[reaction];
      }
  
      // Update the comment in the database
      await ctx.db.patch(commentId, {
        reactions: updatedReactions,
        updatedAt: Date.now(),
      });
  
      return { success: true, message: `Reaction "${reaction}" removed` };
    },
  });