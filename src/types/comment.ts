import { Id } from "../../convex/_generated/dataModel";

export type CommentWithDetails = {
  _id: Id<"comments">;
  authorId: Id<"users">;
  targetId: string;
  targetType: string;
  body: string;
  parentId?: Id<"comments">;
  createdAt: number;
  updatedAt?: number;
  replyCount?: number;
  reactions?: Record<string, Id<"users">[]>;
  authorDetails: {
      _id: Id<"users">;
      name: string;
      email: string;
      image?: string;
  } | null;
  parentComment?: {
      _id: Id<"comments">;
      body?: string;
      authorId?: Id<"users">;
  } | null;
};