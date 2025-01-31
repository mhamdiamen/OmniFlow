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
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export function AddRole() {
  const createRole = useMutation(api.mutations.roles.createRole);
  const permissions = useQuery(api.queries.permissions.fetchAllPermissions); // Fetch all permissions
  const [isOpen, setIsOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Id<"permissions">[]>([]); // Store selected permission IDs
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setRoleName("");
    setRoleDescription("");
    setSelectedPermissions([]);
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      toast.error("Role name is required.");
      return;
    }

    if (selectedPermissions.length === 0) {
      toast.error("At least one permission is required.");
      return;
    }

    try {
      setIsSaving(true);
      await createRole({
        name: roleName.trim(),
        description: roleDescription || undefined,
        permissions: selectedPermissions, // Pass selected permission IDs
      });

      toast.success("Role created successfully!");
      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create role. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePermissionChange = (permissionId: Id<"permissions">) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId) // Deselect if already selected
        : [...prev, permissionId] // Select if not already selected
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)} size="sm">
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          <span>Add Role</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] md:max-w-[800px] p-4 md:p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Add Role</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Fill in the fields to create a new role with permissions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:gap-6">
          {/* Role Name */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="roleName" className="sm:col-span-1 text-sm font-bold">
              Role Name
            </Label>
            <Input
              id="roleName"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Enter role name"
              className="sm:col-span-3"
            />
          </div>

          {/* Role Description */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="roleDescription" className="sm:col-span-1 text-sm font-bold">
              Description
            </Label>
            <Input
              id="roleDescription"
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              placeholder="Enter role description (optional)"
              className="sm:col-span-3"
            />
          </div>

          {/* Permissions */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-4">
            <Label htmlFor="permissions" className="sm:col-span-1 text-sm font-bold">
              Permissions
            </Label>
            <div className="sm:col-span-3 space-y-3">
              {permissions?.map((permission) => (
                <div key={permission._id} className="flex items-center gap-2">
                  <Checkbox
                    id={`permission-${permission._id}`}
                    checked={selectedPermissions.includes(permission._id as Id<"permissions">)}
                    onCheckedChange={() =>
                      handlePermissionChange(permission._id as Id<"permissions">)
                    }
                  />
                  <Label htmlFor={`permission-${permission._id}`} className="text-sm">
                    {permission.name}
                  </Label>
                </div>
              ))}
            </div>
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