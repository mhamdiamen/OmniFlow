"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { CircleAlert, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { toast } from "sonner";

interface DeleteChapterDialogProps {
  triggerText: string; // Text for the trigger button
  title: string; // Title of the dialog
  description: string; // Confirmation message
  chapterId: Id<"chapters">; // ID of the chapter to delete
  chapterTitle: string; // Title of the chapter to confirm deletion
  cancelText?: string; // Custom text for the cancel button
  confirmText?: string; // Custom text for the confirm button
}

export default function DeleteChapterDialog({
  triggerText,
  title,
  description,
  chapterId,
  chapterTitle,
  cancelText = "Cancel",
  confirmText = "Delete",
}: DeleteChapterDialogProps) {
  const [inputValue, setInputValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteChapter = useMutation(api.chapters.deleteChapter); // Mutation for deleting a chapter

  const isConfirmed = inputValue === chapterTitle;

  const handleConfirm = async () => {
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);

    try {
      await deleteChapter({ id: chapterId });
      toast.success(`The chapter "${chapterTitle}" was deleted successfully.`);
    } catch (error) {
      console.error("Error deleting chapter:", error);
      toast.error(`Failed to delete the chapter "${chapterTitle}". Please try again.`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" aria-label="Delete Chapter" size="icon">
          <Trash2 size={18} aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
            aria-hidden="true"
          >
            <CircleAlert className="opacity-80" size={16} strokeWidth={2} />
          </div>
          <DialogHeader>
            <DialogTitle className="sm:text-center mb-4">{title}</DialogTitle>
            <DialogDescription className="sm:text-center">{description}</DialogDescription>
          </DialogHeader>
        </div>

        <form className="space-y-5">
          <div className="space-y-2">
            <Input
              id="chapter-title"
              type="text"
              placeholder={`Type "${chapterTitle}" to confirm`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isDeleting}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="flex-1" disabled={isDeleting}>
                {cancelText}
              </Button>
            </DialogClose>
            <Button
              type="button"
              className="flex-1"
              disabled={!isConfirmed || isDeleting}
              onClick={handleConfirm}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" aria-hidden="true" />
                  Deleting...
                </>
              ) : (
                confirmText
              )}
            </Button>

          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
