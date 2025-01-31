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

interface DeleteRoleDialogProps {
  triggerText: string; // Text for the trigger button
  title: string; // Title of the dialog
  description: React.ReactNode; // Allow JSX elements in description
  roleId: Id<"roles">; // Correctly typed ID for the role
  roleName: string; // Name of the role to confirm deletion
  cancelText?: string; // Custom text for the cancel button (optional)
  confirmText?: string; // Custom text for the confirm button (optional)
}

export default function DeleteRoleDialog({
  triggerText,
  title,
  description,
  roleId,
  roleName,
  cancelText = "Cancel",
  confirmText = "Delete",
}: DeleteRoleDialogProps) {
  const [inputValue, setInputValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteRole = useMutation(api.mutations.roles.removeRoleById); // Hook for Convex mutation

  const isConfirmed = inputValue === roleName;

  const handleConfirm = async () => {
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);

    try {
      await deleteRole({ id: roleId }); // Call mutation with the role ID
      toast.success(`The role "${roleName}" was deleted successfully.`); // Success message with role name
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error(`Failed to delete the role "${roleName}". Please try again.`); // Error message with role name
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" aria-label="Delete Role" size="icon">
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
              id="role-name"
              type="text"
              placeholder={`Type "${roleName}" to confirm`} // Use the roleName here
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