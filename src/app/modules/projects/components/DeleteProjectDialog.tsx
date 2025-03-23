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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { CircleAlert, Loader2 } from "lucide-react";
import { useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { toast } from "sonner";

interface DeleteProjectDialogProps {
  triggerText: string;
  title: string;
  description: React.ReactNode;
  projectId: Id<"projects">;
  projectName: string;
  cancelText?: string;
  confirmText?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}

export default function DeleteProjectDialog({
  triggerText,
  title,
  description,
  projectId,
  projectName,
  cancelText = "Cancel",
  confirmText = "Delete",
  open,
  onOpenChange,
  children,
}: DeleteProjectDialogProps) {
  const [inputValue, setInputValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteProject = useMutation(api.mutations.projects.deleteProject);

  const isConfirmed = inputValue === projectName;

  const handleConfirm = async () => {
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);

    try {
      await deleteProject({ projectId });
      toast.success(`The project "${projectName}" was deleted successfully.`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error(`Failed to delete the project "${projectName}". Please try again.`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              id="project-name"
              type="text"
              placeholder={`Type "${projectName}" to confirm`}
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