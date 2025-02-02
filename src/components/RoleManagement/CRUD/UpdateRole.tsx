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
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Edit, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { PermissionsSelector } from "../components/PermissionsSelector";

interface UpdateRoleProps {
  roleId: Id<"roles">; // ID of the role to update
}

export function UpdateRole({ roleId }: UpdateRoleProps) {
  const role = useQuery(api.queries.roles.getRoleById, { id: roleId });
  const updateRole = useMutation(api.mutations.roles.updateRole);

  const [isOpen, setIsOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Id<"permissions">[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Populate form fields when role data is fetched
  useEffect(() => {
    if (role) {
      setRoleName(role.name);
      setRoleDescription(role.description || "");
      setSelectedPermissions(role.permissions);
    }
  }, [role]);

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
      await updateRole({
        id: roleId,
        name: roleName.trim(),
        description: roleDescription || undefined,
        permissions: selectedPermissions,
      });

      toast.success("Role updated successfully!");
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update role. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePermissionChange = (permissionId: Id<"permissions">) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Edit Role"
          onClick={() => setIsOpen(true)}
        >
          <Edit size={16} strokeWidth={2} aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-h-[80vh] sm:max-w-5xl [&>button:last-child]:top-3.5">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b border-border px-6 py-4 text-base">
            Update Role
          </DialogTitle>
          <DialogDescription asChild>
            <div className="px-6 py-4">
              Modify the fields below to update the role.
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable container for form fields */}
        <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: "60vh" }}>
          {/* Role Name */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center mt-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start mt-4">
            <Label htmlFor="permissions" className="sm:col-span-1 text-sm font-bold">
              Permissions
            </Label>
            <div className="sm:col-span-4">
              <PermissionsSelector
                selectedPermissions={selectedPermissions}
                onPermissionChange={handlePermissionChange}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4 sm:items-center">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving && (
              <Loader2 className="animate-spin mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
