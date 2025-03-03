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
import { Ban } from "lucide-react";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

interface BulkDeleteTeamsDialogProps {
  triggerText: React.ReactNode;
  title: string;
  description: React.ReactNode;
  selectedTeamIds: Id<"teams">[];
  cancelText?: string;
  confirmText?: string;
  onSuccess?: () => void;
  teamIds: Id<"teams">[]; // Add this line

}

export default function BulkDeleteTeamsDialog({
  triggerText,
  title,
  description,
  selectedTeamIds,
  cancelText = "Cancel",
  confirmText = "Delete Teams",
  onSuccess,
}: BulkDeleteTeamsDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const bulkDeleteTeams = useMutation(api.mutations.teams.bulkDeleteTeams);

  const handleConfirm = async () => {
    if (isProcessing) return;

    if (selectedTeamIds.length === 0) {
      toast.error("No teams selected for deletion");
      return;
    }

    setIsProcessing(true);

    try {
      const deletePromise = async () => {
        const result = await bulkDeleteTeams({ teamIds: selectedTeamIds });
        if (!result.success && result.deletedCount === 0) {
          throw new Error("Failed to delete teams");
        }
        return result;
      };

      await toast.promise(deletePromise(), {
        loading: "Deleting teams...",
        success: (result) => {
          return `Successfully deleted ${result.deletedCount} teams.`;
          return `Successfully deleted ${result.deletedCount} teams.`;
        },
        error: (error) => {
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
          return `Failed to delete teams: ${errorMessage}`;
        },
      });

      onSuccess?.();
    } catch (error) {
      console.error("Error processing request:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
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