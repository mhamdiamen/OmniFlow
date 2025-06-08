"use client";

import { TabsContent } from "@/components/ui/tabs";
import { Smile, Paperclip, Plus, MessageSquare } from "lucide-react";
import { useCurrentUser } from "@/app/api/use-current-user";
import { useState } from "react";
import { InputWithActions } from "./InputWithActions";
import { CommentCardWithReplies } from "./CommentCardWithReplies";
import { useMutation, useQuery } from "convex/react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { EmptyState } from "@/components/ModulesManagement/components/ReusableEmptyState";
import { CommentSortControls } from "./CommentSortControls";
import type { CommentSortOption } from "./CommentSortControls";
import { toast } from "sonner";

// Define props for CommentsTab
type CommentsTabProps = {
    targetId: Id<"projects"> | Id<"tasks"> | Id<any>; // Expandable
    targetType: "project" | "task" | string;
};

export function CommentsTab({ targetId, targetType }: CommentsTabProps) {
    const { data: user, isLoading: isLoadingUser } = useCurrentUser();
    const [commentText, setCommentText] = useState("");
    const [sortBy, setSortBy] = useState<CommentSortOption>("newest");

    // Use the createComment mutation
    const createComment = useMutation(api.mutations.comments.createComment);

    // Fetch team members for mentions
    const teamMembers = targetType === "project"
        ? useQuery(api.queries.teams.fetchTeamMembersByProject, {
            projectId: targetId as Id<"projects">
        })
        : undefined;


    const commentsResult = useQuery(api.queries.comments.getCommentsByTarget, {
        targetId,
        targetType,
    });

    // Sort comments based on the selected option
    const sortedComments = commentsResult ? [...commentsResult].sort((a, b) => {
        switch (sortBy) {
            case "newest":
                return b.createdAt - a.createdAt;
            case "oldest":
                return a.createdAt - b.createdAt;
            case "most_liked":
                const aLikes = (a.reactions?.heart?.length || 0) + (a.reactions?.thumbs_up?.length || 0);
                const bLikes = (b.reactions?.heart?.length || 0) + (b.reactions?.thumbs_up?.length || 0);
                return bLikes - aLikes;
            case "most_replies":
                return (b.replyCount || 0) - (a.replyCount || 0);
            default:
                return b.createdAt - a.createdAt;
        }
    }) : [];

    const handleAddEmoji = () => {
        setCommentText((prev) => prev + "🙂");
    };

    const handleAttachFile = () => {
        alert("Attach file clicked");
    };

    const handleAddNote = () => {
        alert("Add note clicked");
    };

    const actions = [
        {
            icon: <Smile size={16} />,
            tooltip: "Add Emoji",
            onClick: handleAddEmoji,
            ariaLabel: "Add emoji",
        },
        {
            icon: <Paperclip size={16} />,
            tooltip: "Attach File",
            onClick: handleAttachFile,
            ariaLabel: "Attach file",
        },
        {
            icon: <Plus size={16} />,
            tooltip: "Add Note",
            onClick: handleAddNote,
            ariaLabel: "Add note",
        },
    ];

    const handleSend = async () => {
        if (!user || !commentText.trim()) return;

        try {
            // Parse mentions from the comment body
            const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
            let match: RegExpExecArray | null;
            const mentionedNames = new Set<string>();

            while ((match = mentionRegex.exec(commentText)) !== null) {
                if (match && match[1]) {  // Additional null check
                    mentionedNames.add(match[1]);
                }
            }

            // Find user IDs for mentioned names
            const mentionedUsers = await Promise.all(
                Array.from(mentionedNames).map(async (name) => {
                    const user = teamMembers?.find(member =>
                        member.name === name || member.email.split('@')[0] === name
                    );
                    return user?._id;
                })
            );

            // Combine valid mentions
            const validMentionedUserIds = mentionedUsers.filter(
                (id): id is Id<"users"> => id !== undefined
            );

            await createComment({
                authorId: user._id as Id<"users">,
                targetId,
                targetType,
                body: commentText,
                parentId: undefined,
                mentionedUserIds: validMentionedUserIds,
            });

            setCommentText("");
            toast.success("Comment posted successfully");
        } catch (error) {
            console.error("Failed to submit comment:", error);
            toast.error("Failed to post comment");
        }
    };

    const totalCommentCount = sortedComments
        ? sortedComments.reduce((count, comment) => {
            return count + 1 + (comment.replyCount || 0);
        }, 0)
        : 0;


    return (
        <TabsContent value="comments">
            {/* Input for new comment */}
            <div className="mb-6">
                <InputWithActions
                    value={commentText}
                    onChange={setCommentText}
                    placeholder="Leave a comment"
                    userAvatarUrl={user?.image}
                    userName={user?.name}
                    isLoadingUser={isLoadingUser}
                    onSend={handleSend}
                    targetId={targetId} // ✅ renamed
                    targetType={targetType} // ✅ optionally pass this too
                />

            </div>

            {/* Comment sorting controls and list */}
            <div className="space-y-4">
                {totalCommentCount > 0 && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MessageSquare size={16} />
                            <span>{totalCommentCount} {totalCommentCount === 1 ? 'comment' : 'comments'}</span>
                        </div>
                        <CommentSortControls sortBy={sortBy} setSortBy={setSortBy} />
                    </div>
                )}

                {sortedComments && sortedComments.length > 0 ? (
                    sortedComments.map((comment) => (
                        <CommentCardWithReplies key={comment._id} comment={comment} />
                    ))
                ) : (
                    <div className="flex justify-center items-center py-10">
                        <EmptyState
                            title="No comments yet"
                            description="Be the first to leave a comment and start the discussion."
                            imageSrc="/chapters-empty.png"
                        />
                    </div>
                )}
            </div>
        </TabsContent>
    );
}