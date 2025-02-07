"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Building } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
// Import the Id type from your Convex-generated types.
import { Id } from "../../convex/_generated/dataModel";

interface CompanySettingsDialogProps {
  open: boolean;
  onClose: () => void;
  company: {
    // Here we assume company.id is a string,
    // but when calling mutations we will cast it to Id<"companies">.
    id: string;
    name: string;
    createdAt: number;
    modules: string[]; // Similarly, these will be cast to Id<"modules"> when needed.
    settings: Record<string, any>;
  } | null;
}

export default function CompanySettingsDialog({
  open,
  onClose,
  company,
}: CompanySettingsDialogProps) {
  // Fetch all available modules.
  const modules = useQuery(api.queries.modules.fetchAllModules, {}) || [];

  // Define mutations to activate/deactivate modules.
  const activateModule = useMutation(api.mutations.companyModules.activateModuleForCompany);
  const deactivateModule = useMutation(api.mutations.companyModules.deactivateModuleForCompany);

  if (!company) return null;

  // Toggle activation state of a module.
  const handleToggleModule = async (moduleId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await deactivateModule({
          // Cast the IDs to the expected Convex ID types.
          companyId: company.id as Id<"companies">,
          moduleId: moduleId as Id<"modules">,
        });
      } else {
        await activateModule({
          companyId: company.id as Id<"companies">,
          moduleId: moduleId as Id<"modules">,
        });
      }
      // Optionally, display a success toast or refresh data here.
    } catch (error) {
      console.error("Error toggling module:", error);
      // Optionally, display an error toast.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border"
            aria-hidden="true"
          >
            <Building size={20} className="stroke-zinc-800 dark:stroke-zinc-100" />
          </div>
          <DialogHeader>
            <DialogTitle className="sm:text-center">{company.name}</DialogTitle>
            <DialogDescription className="sm:text-center">
              Company created on {new Date(company.createdAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
        </div>

        <Card className="p-4 space-y-2">
          <h3 className="text-lg font-semibold">Modules</h3>
          {modules.length > 0 ? (
            <ul className="space-y-2">
              {modules.map((module) => {
                // Assume each module has a unique _id and a name property.
                // Here, module._id is a string, so we will cast it when needed.
                const isActive = company.modules.includes(module._id);
                return (
                  <li key={module._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{module.name}</p>
                      {module.permissions && module.permissions.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Permissions: {module.permissions.join(", ")}
                        </p>
                      )}
                    </div>
                    <Button
                      variant={isActive ? "secondary" : "outline"}
                      onClick={() => handleToggleModule(module._id, isActive)}
                    >
                      {isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground">No modules available</p>
          )}
        </Card>

        <Button variant="outline" className="w-full" onClick={onClose}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
