"use client";

import { Button } from "@/components/ui/button";
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
import { CircleAlert, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { toast } from "sonner";

interface BulkDeleteModulesDialogProps {
  triggerText: React.ReactNode; // ReactNode for flexible trigger styling
  title: string; // Title of the dialog
  description: React.ReactNode; // Allow JSX elements in description
  selectedModuleIds: Id<"modules">[]; // Array of selected module IDs to delete
  cancelText?: string; // Custom text for the cancel button (optional)
  confirmText?: string; // Custom text for the confirm button (optional)
  onSuccess?: () => void; // Callback on successful deletion (optional)
}

export default function BulkDeleteModulesDialog({
  triggerText,
  title,
  description,
  selectedModuleIds,
  cancelText = "Cancel",
  confirmText = "Delete",
  onSuccess,
}: BulkDeleteModulesDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  // Use the bulk delete mutation for modules
  const bulkDeleteModules = useMutation(api.mutations.modules.bulkDeleteModules);

  const handleConfirm = async () => {
    console.log("Confirm button clicked");
    if (isDeleting || selectedModuleIds.length === 0) return;

    console.log("Selected Module IDs:", selectedModuleIds);

    setIsDeleting(true);

    try {
      // Pass the array of module IDs under the key `ids`
      const response = await bulkDeleteModules({
        ids: selectedModuleIds,
      });
      console.log("Response from bulkDeleteModules:", response);

      if (response.success) {
        toast.success("Modules deleted successfully.");
        onSuccess?.();
      } else {
        toast.error("Deletion failed. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting modules:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{triggerText}</AlertDialogTrigger>
      <AlertDialogContent>
        <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
            aria-hidden="true"
          >
            <CircleAlert className="opacity-80" size={16} strokeWidth={2} />
          </div>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? (
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
