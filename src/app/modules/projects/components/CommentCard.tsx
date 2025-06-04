"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import React, { useRef } from "react";
import { MessageSquareIcon, ThumbsUp, ThumbsDown, Ellipsis } from "lucide-react";
import { formatTimeAgo } from "@/lib/dateUtils";
import { CommentType } from "@/types/comment";

interface CommentCardProps {
  comment: CommentType;
  avatarRef?: React.Ref<HTMLDivElement>; // Add ref prop
}

export function CommentCard({ comment, avatarRef }: CommentCardProps) {
  return (
    <div className="flex gap-4">
      {/* User Avatar */}
      <Avatar className="h-10 w-10" ref={avatarRef}>
        <AvatarImage alt={comment.authorName} src={comment.authorAvatar ?? undefined} />
        <AvatarFallback>{comment.authorName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>

      {/* Comment Content */}
      <div className="flex flex-col flex-1">
        {/* Author Name & Timestamp */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold">{comment.authorName}</p>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimeAgo(comment.createdAt)}
            </span>
          </div>
          {/* More Options Button */}
          <button>
            <Ellipsis size={16} />
          </button>
        </div>

        {/* Comment Text */}
        <p className="mt-1 text-sm whitespace-pre-line">
          {comment.text}
        </p>

        {/* Interaction Bar */}
        <div className="flex items-center gap-3 mt-4 text-xs text-gray-500 dark:text-gray-400">
          <button className="flex items-center gap-1 hover:text-gray-600 dark:hover:text-gray-300">
            <ThumbsUp size={14} />
            <span>{comment.likes}</span>
          </button>
          <button className="flex items-center gap-1 hover:text-gray-600 dark:hover:text-gray-300">
            <ThumbsDown size={14} />
            <span>{comment.dislikes}</span>
          </button>
          <button className="flex items-center gap-1 hover:text-gray-600 dark:hover:text-gray-300">
            <MessageSquareIcon size={14} />
            <span>Reply</span>
          </button>
        </div>
      </div>
    </div>
  );
}