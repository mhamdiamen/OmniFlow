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
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Edit, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel"; // Import the Id type

interface UpdatePermissionProps {
  permissionId: Id<"permissions">; // Use Id<"permissions"> type for permissionId
}

export function UpdatePermission({ permissionId }: UpdatePermissionProps) {
  const permission = useQuery(api.queries.permissions.fetchPermissionById, { id: permissionId });
  const updatePermission = useMutation(api.mutations.permissions.updatePermission);

  const [isOpen, setIsOpen] = useState(false);
  const [permissionName, setPermissionName] = useState("");
  const [permissionDescription, setPermissionDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Populate form fields when permission data is fetched
  useEffect(() => {
    if (permission) {
      setPermissionName(permission.name);
      setPermissionDescription(permission.description || "");
    }
  }, [permission]);

  const handleSave = async () => {
    if (!permissionName.trim()) {
      toast.error("Permission name is required.");
      return;
    }

    try {
      setIsSaving(true);
      await updatePermission({
        id: permissionId, // This is now of type Id<"permissions">
        name: permissionName.trim(),
        description: permissionDescription || undefined,
      });

      toast.success("Permission updated successfully!");
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update permission. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Edit Permission"
          onClick={() => setIsOpen(true)}
        >
          <Edit size={16} strokeWidth={2} aria-hidden="true" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] md:max-w-[800px] p-4 md:p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Update Permission</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Modify the fields below to update the permission.
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