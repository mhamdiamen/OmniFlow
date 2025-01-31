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

interface CompanySettingsDialogProps {
  open: boolean;
  onClose: () => void;
  company: {
    name: string;
    createdAt: number;
    modules: string[];
    settings: Record<string, any>;
  } | null;
}

export default function CompanySettingsDialog({ open, onClose, company }: CompanySettingsDialogProps) {
  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border"
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
          {company.modules.length > 0 ? (
            <ul className="list-disc pl-5">
              {company.modules.map((module, index) => (
                <li key={index}>{module}</li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No modules assigned</p>
          )}
        </Card>

        <Button variant="outline" className="w-full" onClick={onClose}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
