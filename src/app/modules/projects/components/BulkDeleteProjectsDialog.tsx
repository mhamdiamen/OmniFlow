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
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

interface BulkDeleteProjectsDialogProps {
    triggerText: React.ReactNode;
    title: string;
    description: React.ReactNode;
    selectedProjectIds: Id<"projects">[];
    cancelText?: string;
    confirmText?: string;
    onSuccess?: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function BulkDeleteProjectsDialog({
    triggerText,
    title,
    description,
    selectedProjectIds,
    cancelText = "Cancel",
    confirmText = "Delete Projects",
    onSuccess,
    open,
    onOpenChange,
}: BulkDeleteProjectsDialogProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const bulkDeleteProjects = useMutation(api.mutations.projects.bulkDeleteProjects);

    const handleConfirm = async () => {
        if (isProcessing) return;

        if (selectedProjectIds.length === 0) {
            toast.error("No projects selected for deletion");
            return;
        }

        setIsProcessing(true);

        try {
            console.log("Deleting projects:", selectedProjectIds);
            const deletePromise = async () => {
                const result = await bulkDeleteProjects({ projectIds: selectedProjectIds });
                console.log("Response from bulkDeleteProjects:", result);
                
                if (!result.success && result.deletedCount === 0) {
                    throw new Error(result.message || "Failed to delete projects");
                }
                
                return result;
            };

            // Use toast.promise for better UX
            await toast.promise(deletePromise(), {
                loading: "Deleting projects...",
                success: (result) => {
                    if (result.errors && result.errors.length > 0) {
                        return `Deleted ${result.deletedCount} projects with some errors. Check console for details.`;
                    }
                    return `Successfully deleted ${result.deletedCount} projects.`;
                },
                error: (error) => {
                    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
                    return `Failed to delete projects: ${errorMessage}`;
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