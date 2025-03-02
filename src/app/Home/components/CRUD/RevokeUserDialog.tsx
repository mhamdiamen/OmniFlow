"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Ban, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface RevokeUserDialogProps {
    userId: Id<"users">;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

interface RevokeUserButtonProps {
    userId: Id<"users">;
    buttonVariant?: "ghost" | "destructive" | "outline";
    buttonSize?: "icon" | "sm" | "default" | "lg";
    buttonClassName?: string;
    children?: React.ReactNode;
}

export function RevokeUserDialog({
    userId,
    isOpen,
    onOpenChange
}: RevokeUserDialogProps) {
    const revokeUser = useMutation(api.mutations.users.revokeUserFromCompany);

    const handleRevoke = async () => {
        const revokePromise = async () => {
            try {
                await revokeUser({ userId });
                // Close the dialog on success
                onOpenChange(false);
                return true;
            } catch (error) {
                console.error("Failed to revoke user:", error);
                throw error; // Rethrow for toast.promise error handler
            }
        };

        // Use toast.promise to handle loading, success, and error states
        toast.promise(revokePromise(), {
            loading: "Revoking user access...",
            success: () => "User access revoked successfully!",
            error: (error) => {
                const errorMessage = error?.message || "An unknown error occurred";
                
                // Handle specific error cases if needed
                if (errorMessage.includes("permission denied")) {
                    return "You don't have permission to revoke this user's access.";
                } else if (errorMessage.includes("user not found")) {
                    return "User not found. They may have already been removed.";
                } else {
                    return `Failed to revoke user access: ${errorMessage}`;
                }
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you sure?</DialogTitle>
                    <DialogDescription>
                        This action will revoke the user from the company and remove their
                        access. This cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleRevoke}>
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function RevokeUserButton({
    userId,
    buttonVariant = "ghost",
    buttonSize = "icon",
    buttonClassName = "-ms-1 ",
    children
}: RevokeUserButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                variant={buttonVariant}
                size={buttonSize}
                className={buttonClassName}
                onClick={() => setIsOpen(true)}
            >
                {children || (
                    <>
                        <Ban className="mr-2 h-4 w-4" />
                        <span>Revoke access</span>
                    </>
                )}
            </Button>

            <RevokeUserDialog userId={userId} isOpen={isOpen} onOpenChange={setIsOpen} />
        </>
    );
}