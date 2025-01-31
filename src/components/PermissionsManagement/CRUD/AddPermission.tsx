"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "../../../../convex/_generated/api";

export function AddPermission() {
  const createPermission = useMutation(api.mutations.permissions.createPermission);
  const [isOpen, setIsOpen] = useState(false);
  const [permissionName, setPermissionName] = useState("");
  const [permissionDescription, setPermissionDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setPermissionName("");
    setPermissionDescription("");
  };

  const handleSave = async () => {
    if (!permissionName.trim()) {
      toast.error("Permission name is required.");
      return;
    }

    try {
      setIsSaving(true);
      await createPermission({
        name: permissionName.trim(),
        description: permissionDescription || undefined,
      });

      toast.success("Permission created successfully!");
      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create permission. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)} size="sm">
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          <span>Add Permission</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] md:max-w-[800px] p-4 md:p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Add Permission</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Fill in the fields to create a new permission.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:gap-6">
          {/* Permission Name */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="permissionName" className="sm:col-span-1 text-sm font-bold">
              Permission Name
            </Label>
            <Input
              id="permissionName"
              value={permissionName}
              onChange={(e) => setPermissionName(e.target.value)}
              placeholder="Enter permission name"
              className="sm:col-span-3"
            />
          </div>

          {/* Permission Description */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="permissionDescription" className="sm:col-span-1 text-sm font-bold">
              Description
            </Label>
            <Input
              id="permissionDescription"
              value={permissionDescription}
              onChange={(e) => setPermissionDescription(e.target.value)}
              placeholder="Enter permission description (optional)"
              className="sm:col-span-3"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="animate-spin mr-2 h-4 w-4" aria-hidden="true" />
            ) : null}
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
