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
import { CircleAlert, Loader2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import { toast } from "sonner";

interface BulkDeleteDialogProps {
    triggerText: React.ReactNode;
    title: string;
    description: React.ReactNode;
    selectedChapterIds: Id<"chapters">[]; // Changed to chapter IDs
    cancelText?: string;
    confirmText?: string;
    onSuccess?: () => void;
}

export default function BulkDeleteDialog({
    triggerText,
    title,
    description,
    selectedChapterIds,
    cancelText = "Cancel",
    confirmText = "Delete",
    onSuccess,
}: BulkDeleteDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const removeChapters = useMutation(api.chapters.removeChapters); // Adjusted for chapters API

    const handleConfirm = async () => {
        if (isDeleting || selectedChapterIds.length === 0) return;

        setIsDeleting(true);

        try {
            const response = await removeChapters({ ids: selectedChapterIds }); // Pass chapter IDs
            if (response.success) {
                toast.success(`${response.deletedCount} chapters deleted successfully.`);
                onSuccess?.();
            } else {
                toast.error("Failed to delete some or all chapters. Please try again.");
            }
        } catch (error) {
            console.error("Error deleting chapters:", error);
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
