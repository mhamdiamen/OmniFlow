"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Ban, Loader2 } from "lucide-react";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";

interface BulkDeleteTasksDialogProps {
  triggerText: React.ReactNode;
  title: string;
  description: React.ReactNode;
  selectedTaskIds: Id<"tasks">[];
  cancelText?: string;
  confirmText?: string;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function BulkDeleteTasksDialog({
  triggerText,
  title,
  description,
  selectedTaskIds,
  cancelText = "Cancel",
  confirmText = "Delete Tasks",
  onSuccess,
  open,
  onOpenChange,
}: BulkDeleteTasksDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const bulkDeleteTasks = useMutation(api.mutations.tasks.bulkDeleteTasks);

  const handleConfirm = async () => {
    if (isProcessing) return;

    if (selectedTaskIds.length === 0) {
      toast.error("No tasks selected for deletion");
      return;
    }

    setIsProcessing(true);

    try {
      console.log("Deleting tasks:", selectedTaskIds);
      const deletePromise = async () => {
        const result = await bulkDeleteTasks({ taskIds: selectedTaskIds });
        console.log("Response from bulkDeleteTasks:", result);
        
        if (!result.success && result.deletedCount === 0) {
          throw new Error("Failed to delete tasks");
        }
        
        return result;
      };

      // Use toast.promise for better UX
      await toast.promise(deletePromise(), {
        loading: "Deleting tasks...",
        success: (result) => {
          return `Successfully deleted ${result.deletedCount} tasks.`;
        },
        error: (error) => {
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
          return `Failed to delete tasks: ${errorMessage}`;
        },
      });
      
      onSuccess?.();
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error processing request:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {triggerText && <AlertDialogTrigger asChild>{triggerText}</AlertDialogTrigger>}
      <AlertDialogContent>
        <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
            aria-hidden="true"
          >
            <Ban className="opacity-80" size={16} strokeWidth={2} />
          </div>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" aria-hidden="true" />
                Deleting...
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 