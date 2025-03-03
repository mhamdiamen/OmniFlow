"use client";

import { useState } from "react";
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
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

export function CreateProject() {
  const createProject = useMutation(api.mutations.projects.createProject);
  const currentUserQuery = useQuery(api.users.CurrentUser);
  const currentUser = currentUserQuery;

  // Dialog open state.
  const [isOpen, setIsOpen] = useState(false);

  // Form state for the project.
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [status, setStatus] = useState<"planned" | "in_progress" | "completed" | "on_hold" | "canceled">("planned");
  const [startDate, setStartDate] = useState(new Date().getTime());
  const [endDate, setEndDate] = useState<number | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setProjectName("");
    setProjectDescription("");
    setStatus("planned");
    setStartDate(new Date().getTime());
    setEndDate(undefined);
  };

  const handleSave = async () => {
    if (!projectName.trim()) {
      toast.error("Project name is required.");
      return;
    }

    if (!currentUser) {
      toast.error("User not authenticated.");
      return;
    }

    try {
      setIsSaving(true);
      await createProject({
        name: projectName.trim(),
        description: projectDescription || undefined,
        companyId: currentUser.companyId as Id<"companies">,
        teamId: currentUser.teamId,
        status,
        startDate,
        endDate: endDate || undefined,
      });
      toast.success("Project created successfully!");
      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create project. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the fields to create a new project.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable container for form fields */}
        <div className="grid gap-4 py-4">
          {/* Project Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
              className="col-span-3"
            />
          </div>

          {/* Project Description */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Enter project description (optional)"
              className="col-span-3"
            />
          </div>

          {/* Status */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as "planned" | "in_progress" | "completed" | "on_hold" | "canceled")}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDate" className="text-right">
              Start Date
            </Label>
            <Input
              id="startDate"
              type="number"
              value={startDate}
              onChange={(e) => setStartDate(Number(e.target.value))}
              placeholder="Enter start date (timestamp)"
              className="col-span-3"
            />
          </div>

          {/* End Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endDate" className="text-right">
              End Date
            </Label>
            <Input
              id="endDate"
              type="number"
              value={endDate || ""}
              onChange={(e) => setEndDate(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Enter end date (timestamp) (optional)"
              className="col-span-3"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </DialogClose>
          {isSaving && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}