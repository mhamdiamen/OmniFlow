"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Id } from "../../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

interface PermissionsSelectorProps {
  selectedPermissions: Id<"permissions">[];
  onPermissionChange: (permissionId: Id<"permissions">) => void;
}

export function PermissionsSelector({
  selectedPermissions,
  onPermissionChange,
}: PermissionsSelectorProps) {
  const permissions = useQuery(api.queries.permissions.fetchAllPermissions); // Fetch all permissions

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* 2 permissions per line */}
      {permissions?.map((permission) => (
        <div
          key={permission._id}
          className="relative flex w-full items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring"
        >
          <Checkbox
            id={`permission-${permission._id}`}
            className="order-1 after:absolute after:inset-0"
            checked={selectedPermissions.includes(permission._id as Id<"permissions">)}
            onCheckedChange={() => onPermissionChange(permission._id as Id<"permissions">)}
            aria-describedby={`${permission._id}-description`}
          />
          <div className="grid grow gap-2">
            <Label htmlFor={`permission-${permission._id}`}>
              {permission.name}
           
            </Label>
            <p
              id={`${permission._id}-description`}
              className="text-xs text-muted-foreground"
            >
              {permission.description || "No description provided."}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}