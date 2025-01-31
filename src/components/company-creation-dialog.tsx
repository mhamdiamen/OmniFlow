import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Building } from "lucide-react";

interface CompanyCreationDialogProps {
  open: boolean;
  onClose: () => void;
  companyName: string;
  setCompanyName: (name: string) => void;
  handleCreateCompany: () => void;
}

export default function CompanyCreationDialog({
  open,
  onClose,
  companyName,
  setCompanyName,
  handleCreateCompany,
}: CompanyCreationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <div className="mb-2 flex flex-col items-center gap-2">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border"
            aria-hidden="true"
          >
            <Building size={20} className="stroke-zinc-800 dark:stroke-zinc-100" />
          </div>
          <DialogHeader>
            <DialogTitle className="sm:text-center">Create Your Company</DialogTitle>
            <DialogDescription className="sm:text-center">
              Enter your company name to get started.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className="space-y-5">
          <div className="space-y-2">
            <Input
              placeholder="Enter company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <Button type="button" className="w-full" onClick={handleCreateCompany}>
            Create Company
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          By creating a company, you agree to our{" "}
          <a className="underline hover:no-underline" href="#">
            Terms & Conditions
          </a>
          .
        </p>
      </DialogContent>
    </Dialog>
  );
}
