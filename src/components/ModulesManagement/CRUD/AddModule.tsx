"use client";

import { useState, useId } from "react";
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
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Switch } from "@/components/ui/switch";
import { PermissionsSelector } from "../components/PermissionsSelector";

export function AddModule() {
  const createModule = useMutation(api.mutations.modules.createModule);
  const [isOpen, setIsOpen] = useState(false);
  const [moduleName, setModuleName] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [isActiveByDefault, setIsActiveByDefault] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<Id<"permissions">[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Use useId for a unique id for the switch
  const switchId = useId();

  const resetForm = () => {
    setModuleName("");
    setModuleDescription("");
    setIsActiveByDefault(false);
    setSelectedPermissions([]);
  };

  const handleSave = async () => {
    if (!moduleName.trim()) {
      toast.error("Module name is required.");
      return;
    }

    try {
      setIsSaving(true);
      await createModule({
        name: moduleName.trim(),
        description: moduleDescription || undefined,
        isActiveByDefault,
        permissions: selectedPermissions.length > 0 ? selectedPermissions : undefined,
      });
      toast.success("Module created successfully!");
      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create module. Please try again.");
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
        <Button onClick={() => setIsOpen(true)} size="sm">
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          <span>Add Module</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="flex flex-col gap-0 p-0 sm:max-h-[80vh] sm:max-w-5xl [&>button:last-child]:top-3.5">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b border-border px-6 py-4 text-base">
            Add Module
          </DialogTitle>
          <DialogDescription asChild>
            <div className="px-6 py-4">
              Fill in the fields to create a new module.
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable container for form fields */}
        <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: "60vh" }}>
          {/* Module Name */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            <Label htmlFor="moduleName" className="sm:col-span-1 text-sm font-bold">
              Module Name
            </Label>
            <Input
              id="moduleName"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              placeholder="Enter module name"
              className="sm:col-span-3"
            />
          </div>

          {/* Module Description */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center mt-4">
            <Label htmlFor="moduleDescription" className="sm:col-span-1 text-sm font-bold">
              Description
            </Label>
            <Input
              id="moduleDescription"
              value={moduleDescription}
              onChange={(e) => setModuleDescription(e.target.value)}
              placeholder="Enter module description (optional)"
              className="sm:col-span-3"
            />
          </div>

          {/* Active By Default using Switch */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center mt-4">
            <Label htmlFor={switchId} className="sm:col-span-1 text-sm font-bold">
              Active By Default
            </Label>
            <div className="sm:col-span-3">
              <div className="relative inline-grid h-9 grid-cols-[1fr_1fr] items-center text-sm font-medium">
                <Switch
                  id={switchId}
                  checked={isActiveByDefault}
                  onCheckedChange={(checked) => setIsActiveByDefault(checked === true)}
                  className="peer absolute inset-0 h-[inherit] w-auto rounded-lg data-[state=unchecked]:bg-input/50 [&_span]:z-10 [&_span]:h-full [&_span]:w-1/2 [&_span]:rounded-md [&_span]:transition-transform [&_span]:duration-300 [&_span]:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)] data-[state=checked]:[&_span]:translate-x-full rtl:data-[state=checked]:[&_span]:-translate-x-full"
                />
                <span className="min-w-78flex pointer-events-none relative ms-0.5 items-center justify-center px-2 text-center transition-transform duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] peer-data-[state=checked]:invisible peer-data-[state=unchecked]:translate-x-full rtl:peer-data-[state=unchecked]:-translate-x-full">
                  <span className="text-[10px] font-medium uppercase">Off</span>
                </span>
                <span className="min-w-78flex pointer-events-none relative me-0.5 items-center justify-center px-2 text-center transition-transform duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] peer-data-[state=unchecked]:invisible peer-data-[state=checked]:-translate-x-full peer-data-[state=checked]:text-background rtl:peer-data-[state=checked]:translate-x-full">
                  <span className="text-[10px] font-medium uppercase">On</span>
                </span>
              </div>
              <Label htmlFor={switchId} className="sr-only">
                Active By Default
              </Label>
            </div>
          </div>

          {/* Permissions Selector */}
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
