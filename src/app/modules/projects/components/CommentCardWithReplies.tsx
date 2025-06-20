"use client";

import { useState } from "react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, ThumbsUp, ThumbsDown, Ellipsis, Smile, Paperclip, Heart, CircleX, Edit, Check, X } from "lucide-react";
import { useCurrentUser } from "@/app/api/use-current-user";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { InputWithActions } from "./InputWithActions";
import { CommentActionsDropdown } from "./CommentActionsDropdown";
import { Badge } from "@/components/ui/badge";

type CommentWithDetails = {
    _id: Id<"comments">;
    authorId: Id<"users">;
    targetId: string; // The ID of the target the comment is related to (e.g., a post or another comment)
    targetType: string; // The type of the target (e.g., "post", "issue")
    body: string; // The comment content
    parentId?: Id<"comments">; // Optional parent comment (for replies)
    createdAt: number;
    updatedAt?: number;
    replyCount?: number;
    reactions?: Record<string, Id<"users">[]>; // Reaction type mapped to list of user IDs
    mentionedUserIds?: Id<"users">[]; // Add this line for mentions
    authorDetails: {
        _id: Id<"users">;
        name: string;
        email: string;
        image?: string;
    } | null; // Author's profile info

    parentComment?: {
        _id: Id<"comments">;
        body?: string;
        authorId?: Id<"users">;
    } | null; // Brief info about parent comment, if this is a reply
};

type ReactionType = "heart" | "thumbs_up" | "thumbs_down"; // Supported reaction types

// ----------------------------
// Component: CommentCardWithReplies
// ----------------------------

/**
 * Displays a comment with replies, reactions, and editing capabilities.
 */
export function CommentCardWithReplies({ comment }: { comment: CommentWithDetails }) {
    // Local state
    const [isReplying, setIsReplying] = useState(false); // Toggle reply form
    const [isEditing, setIsEditing] = useState(false); // Toggle edit mode

    const [mentionedUserIds, setMentionedUserIds] = useState<Id<"users">[]>(comment.mentionedUserIds || []);

    // Fetch team members for mentions
    const teamMembers = useQuery(
        api.queries.teams.fetchTeamMembersByProject,
        comment.targetType === "project"
            ? { projectId: comment.targetId as Id<"projects"> }
            : "skip"
    ) ?? [];

    const [replyText, setReplyText] = useState(""); // Reply input
    const [editText, setEditText] = useState(comment.body); // Edit input

    const [showReplies, setShowReplies] = useState(false); // Toggle replies visibility

    // Data fetching and mutations
    const repliesResult = useQuery(api.queries.comments.getRepliesToComment, {
        parentId: comment._id,
    });

    const replies = repliesResult?.replies ?? [];

    const createReply = useMutation(api.mutations.comments.createComment);
    const addReaction = useMutation(api.mutations.comments.addReactionToComment);
    const removeReaction = useMutation(api.mutations.comments.removeReactionFromComment);
    const updateComment = useMutation(api.mutations.comments.updateComment);

    const { data: currentUser } = useCurrentUser(); // Get current user info
    const router = useRouter(); // Router for navigation

    // ----------------------------
    // Helper Functions
    // ----------------------------

    /**
     * Check if the current user has already reacted with a specific reaction type.
     */
    const hasReacted = (reaction: ReactionType) => {
        if (!currentUser || !comment.reactions?.[reaction]) return false;
        return comment.reactions[reaction].includes(currentUser._id as Id<"users">);
    };

    /**
     * Get the count of a specific reaction on the comment.
     */
    const getReactionCount = (reaction: ReactionType) => {
        return comment.reactions?.[reaction]?.length || 0;
    };

    /**
     * Toggle a reaction for the comment by the current user.
     */
    const toggleReaction = async (reaction: ReactionType) => {
        if (!currentUser) {
            toast.error("Please sign in to react", {
                action: {
                    label: "Sign in",
                    onClick: () => router.push('/sign-in'),
                },
            });
            return;
        }

        try {
            const payload = {
                commentId: comment._id,
                userId: currentUser._id as Id<"users">,
                reaction,
                targetId: comment.targetId,
                targetType: comment.targetType,
            };

            if (hasReacted(reaction)) {
                await removeReaction(payload);
            } else {
                await addReaction(payload);
            }
        } catch (error) {
            console.error("Failed to toggle reaction:", error);
            toast.error("Failed to update reaction");
        }

    };

    /**
     * Submit a reply to the comment.
     */
    const handleReply = async () => {
        if (!replyText.trim()) {
            toast.error("Reply cannot be empty");
            return;
        }

        if (!currentUser) {
            toast.error("Please sign in to post a reply", {
                action: {
                    label: "Sign in",
                    onClick: () => router.push('/sign-in'),
                },
            });
            return;
        }

        try {
            // Parse mentions from the reply text
            const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
            let match;
            const mentionedNames = new Set<string>();

            while ((match = mentionRegex.exec(replyText)) !== null) {
                if (match && match[1]) {
                    mentionedNames.add(match[1]);
                }
            }

            // Find user IDs for mentioned names
            const mentionedUserIds = Array.from(mentionedNames)
                .map(name => {
                    const user = teamMembers.find(member =>
                        member.name === name ||
                        (member.email && member.email.split('@')[0] === name)
                    );
                    return user?._id;
                })
                .filter((id): id is Id<"users"> => id !== undefined);

            await createReply({
                targetId: comment.targetId,
                targetType: comment.targetType,
                body: replyText,
                parentId: comment._id,
                mentionedUserIds, // Pass the parsed mentions
                authorId: currentUser._id as Id<"users">,
            });

            setReplyText("");
            setIsReplying(false);
            toast.success("Reply posted successfully");
        } catch (error) {
            console.error("Failed to submit reply:", error);
            toast.error("Failed to post reply");
        }
    };

    /**
     * Toggle visibility of replies for this comment.
     */
    const handleToggleReplies = () => {
        setShowReplies(prev => !prev);
    };

    /**
     * Submit edited comment.
     */
    const handleEdit = async () => {
        if (!editText.trim()) {
            toast.error("Comment cannot be empty");
            return;
        }

        if (!currentUser) {
            toast.error("Please sign in to edit comments");
            return;
        }

        try {
            await updateComment({
                commentId: comment._id,
                body: editText,
                mentionedUserIds,
                targetId: comment.targetId,       // Make sure this exists on your comment object
                targetType: comment.targetType,   // Make sure this exists on your comment object
            });
            setIsEditing(false);
            toast.success("Comment updated successfully");
        } catch (error) {
            console.error("Failed to update comment:", error);
            toast.error("Failed to update comment");
        }

    };

    /**
     * Cancel edit mode and reset text.
     */
    const handleCancelEdit = () => {
        setEditText(comment.body);
        setIsEditing(false);
    };

    const parseCommentBody = (text: string, mentionedUserIds?: Id<"users">[], teamMembers?: any[]) => {
        if (!text) return null;

        const parts = text.split(/(@\w+)/g);

        return parts.map((part, index) => {
            if (part.startsWith('@')) {
                const username = part.substring(1);
                const user = teamMembers?.find(member =>
                    member.name === username ||
                    (member.email && member.email.split('@')[0] === username)
                );

                return (
                    <Badge
                        key={index}
                        className="gap-1 mx-0.5 hover:bg-secondary/80 cursor-pointer"
                        onClick={() => {
                            if (user) {
                                // Optional: Add click handler for user navigation
                                // router.push(`/users/${user._id}`);
                            }
                        }}
                    >
                        {user && (
                            <Avatar className="h-4 w-4 text-[10px]">
                                <AvatarImage
                                    alt={user.name || "Mentioned user"}
                                    src={user.image}
                                />
                                <AvatarFallback>
                                    {user.name?.charAt(0).toUpperCase() || '@'}
                                </AvatarFallback>
                            </Avatar>
                        )}
                        <span>{part}</span>

                    </Badge>
                );
            }
            return part;
        });
    };
    return (
        <Card className="p-4">
            <div className="flex gap-4">
                <div className="shrink-0">
                    <Avatar className="h-10 w-10">
                        <AvatarImage alt={comment.authorDetails?.name || "User"} src={comment.authorDetails?.image} />
                        <AvatarFallback>
                            {comment.authorDetails?.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                </div>

                <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-bold">{comment.authorDetails?.name || "Unknown"}</p>
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                        </div>
                        <CommentActionsDropdown
                            commentId={comment._id}
                            authorId={comment.authorId}
                            targetId={comment.targetId}
                            targetType={comment.targetType}
                        />

                    </div>

                    {isEditing ? (
                        <div className="mt-3">
                            <InputWithActions
                                value={editText}
                                onChange={(newValue) => {
                                    setEditText(newValue);
                                    // Parse mentions from the text
                                    const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
                                    let match;
                                    const mentionedNames = new Set<string>();

                                    while ((match = mentionRegex.exec(newValue)) !== null) {
                                        if (match && match[1]) {
                                            mentionedNames.add(match[1]);
                                        }
                                    }

                                    // Update mentionedUserIds based on the parsed names
                                    if (teamMembers) {
                                        const newMentionedUserIds = Array.from(mentionedNames)
                                            .map(name => {
                                                const user = teamMembers.find(member =>
                                                    member.name === name || member.email.split('@')[0] === name
                                                );
                                                return user?._id;
                                            })
                                            .filter((id): id is Id<"users"> => id !== undefined);

                                        setMentionedUserIds(newMentionedUserIds);
                                    }
                                }}
                                placeholder="Edit your comment..."
                                showAvatar={false}
                                onSend={handleEdit}
                                targetId={comment.targetType === "project" ? (comment.targetId as Id<"projects">) : undefined}
                                targetType={comment.targetType}
                            />
                        </div>
                    ) : (
                        <div className="mt-1 text-sm whitespace-pre-line">
                            {parseCommentBody(comment.body, comment.mentionedUserIds, teamMembers)}
                        </div >
                    )}
                    <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-0.5">
                            <button
                                onClick={() => toggleReaction("heart")}
                                className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground ${hasReacted("heart") ? " border-gray-300 bg-muted" : " border-transparent"
                                    }`}
                            >
                                <Heart size={12} className={hasReacted("heart") ? "text-red-500" : ""} />
                                <span className={hasReacted("heart") ? "text-red-500" : ""}>
                                    {getReactionCount("heart")}
                                </span>
                            </button>

                            <button
                                onClick={() => toggleReaction("thumbs_up")}
                                className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground ${hasReacted("thumbs_up") ? " border-gray-300 bg-muted" : " border-transparent"
                                    }`}
                            >
                                <ThumbsUp size={12} className={hasReacted("thumbs_up") ? "text-blue-500" : ""} />
                                <span className={hasReacted("thumbs_up") ? "text-blue-500" : ""}>
                                    {getReactionCount("thumbs_up")}
                                </span>
                            </button>

                            <button
                                onClick={() => setIsReplying((prev) => !prev)}
                                className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs ${isReplying
                                    ? "bg-muted text-red-500"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {isReplying ? <CircleX size={12} /> : <MessageSquare size={12} />}
                                <span>{isReplying ? "Cancel" : "Reply"}</span>
                            </button>

                        </div>

                        {replies.length > 0 && (
                            <button
                                onClick={handleToggleReplies}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                {showReplies ? "Hide Replies" : `Show Replies (${replies.length})`}
                            </button>
                        )}
                        {/* Add Edit button - only visible to comment author */}
                        {currentUser?._id === comment.authorId && (
                            <button
                                onClick={() => setIsEditing((prev) => !prev)}
                                className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs ${isEditing
                                    ? "bg-muted text-red-500"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {isEditing ? <CircleX size={12} /> : <Edit size={12} />}
                                <span>{isEditing ? "Cancel" : "Edit"}</span>
                            </button>
                        )}
                    </div>

                </div>
            </div>

            {
                isReplying && (
                    <div className="mt-3 pl-12">
                        <InputWithActions
                            value={replyText}
                            onChange={(newValue) => {
                                setReplyText(newValue);
                                // Parse mentions from the text
                                const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
                                let match;
                                const mentionedNames = new Set<string>();

                                while ((match = mentionRegex.exec(newValue)) !== null) {
                                    if (match && match[1]) {
                                        mentionedNames.add(match[1]);
                                    }
                                }

                                // Update mentionedUserIds based on the parsed names
                                if (teamMembers) {
                                    const newMentionedUserIds = Array.from(mentionedNames)
                                        .map(name => {
                                            const user = teamMembers.find(member =>
                                                member.name === name ||
                                                (member.email && member.email.split('@')[0] === name)
                                            );
                                            return user?._id;
                                        })
                                        .filter((id): id is Id<"users"> => id !== undefined);

                                    // If you want to track mentions in state for replies too
                                    // setMentionedUserIds(newMentionedUserIds);
                                }
                            }}
                            placeholder="Write a reply..."
                            userAvatarUrl={currentUser?.image}
                            userName={currentUser?.name || "You"}
                            onSend={handleReply}
                            targetId={comment.targetType === "project" ? (comment.targetId as Id<"projects">) : undefined}
                            targetType={comment.targetType}
                        />
                    </div>
                )
            }

            {
                showReplies && replies.length > 0 && (
                    <div className="mt-4 pl-12 space-y-4 relative">
                        <div className="absolute left-[20px] top-[-60px] bottom-[59px] w-px bg-gray-500 dark:bg-gray-500 rounded-full" />
                        <div className="relative space-y-4">
                            {replies.map((reply) => (
                                <div key={reply._id} className="relative">
                                    <div className="absolute left-[-28px] top-[50%] translate-y-[-50%] h-px w-7 bg-gray-500 dark:bg-gray-500 rounded-full" />
                                    <CommentCardWithReplies comment={reply} />
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }
        </Card >
    );
}
