"use client";

import { useState } from "react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Ellipsis, Trash, Share2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/app/api/use-current-user";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function CommentActionsDropdown({
  commentId,
  authorId,
  targetId,
  targetType,

}: {
  commentId: Id<"comments">;
  authorId: Id<"users">;
  targetId: string;
  targetType: string;

}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteComment = useMutation(api.mutations.comments.deleteComment);
  const { data: currentUser } = useCurrentUser();
  const router = useRouter();

  const handleDelete = async () => {
    try {
      await deleteComment({
        commentId,
        targetId,
        targetType,
      });
      toast.success("Comment deleted successfully");
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error("Failed to delete comment");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };


  const isAuthor = currentUser?._id === authorId;

  if (!currentUser) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-muted/50 cursor-pointer"
          >
            <Ellipsis size={16} className="opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48" align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer">
              <Share2 size={16} className="mr-2 opacity-60" />
              <span>Share</span>
            </DropdownMenuItem>

            {!isAuthor && (
              <DropdownMenuItem className="cursor-pointer">
                <Flag size={16} className="mr-2 opacity-60" />
                <span>Report</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>

          {isAuthor && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-500 focus:text-red-500"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash size={16} className="mr-2" />
                <span>Delete</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              comment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}