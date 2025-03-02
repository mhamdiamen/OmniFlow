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

interface BulkDeleteDialogProps {
    triggerText: React.ReactNode; // ReactNode for flexible trigger styling
    title: string; // Title of the dialog
    description: React.ReactNode; // Allow JSX elements in description
    selectedUserIds: Id<"users">[]; // Array of selected user IDs to revoke
    cancelText?: string; // Custom text for the cancel button (optional)
    confirmText?: string; // Custom text for the confirm button (optional)
    onSuccess?: () => void; // Callback on successful deletion (optional)
}

export default function BulkDeleteDialog({
    triggerText,
    title,
    description,
    selectedUserIds,
    cancelText = "Cancel",
    confirmText = "Revoke Users",
    onSuccess,
}: BulkDeleteDialogProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const bulkRevokeUsers = useMutation(api.mutations.users.bulkRevokeUsersFromCompany);

    const handleConfirm = async () => {
        if (isProcessing) return;

        if (selectedUserIds.length === 0) {
            toast.error("No users selected for revocation");
            return;
        }

        setIsProcessing(true);

        try {
            console.log("Revoking users:", selectedUserIds);
            const revokePromise = async () => {
                const result = await bulkRevokeUsers({ userIds: selectedUserIds });
                console.log("Response from bulkRevokeUsers:", result);
                
                if (!result.success && result.revokedCount === 0) {
                    throw new Error(result.message || "Failed to revoke users");
                }
                
                return result;
            };

            // Use toast.promise for better UX
            await toast.promise(revokePromise(), {
                loading: "Revoking user access...",
                success: (result) => {
                    if (result.errors && result.errors.length > 0) {
                        return `Revoked ${result.revokedCount} users with some errors. Check console for details.`;
                    }
                    return `Successfully revoked ${result.revokedCount} users from the company.`;
                },
                error: (error) => {
                    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
                    return `Failed to revoke users: ${errorMessage}`;
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
                                Revoking...
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