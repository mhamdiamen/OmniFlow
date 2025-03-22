"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";

export function CreateProject() {
  const router = useRouter();
  const createProject = useMutation(api.mutations.projects.createProject);
  const currentUserQuery = useQuery(api.users.CurrentUser);
  const currentUser = currentUserQuery;

  // Form state for the project.
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [status, setStatus] = useState<"planned" | "in_progress" | "completed" | "on_hold" | "canceled">("planned");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]); // Format as YYYY-MM-DD
  const [endDate, setEndDate] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

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
      
      // Convert dates to timestamps
      const startTimestamp = new Date(startDate).getTime();
      const endTimestamp = endDate ? new Date(endDate).getTime() : undefined;
      
      await createProject({
        name: projectName.trim(),
        description: projectDescription || undefined,
        companyId: currentUser.companyId as Id<"companies">,
        teamId: currentUser.teamId,
        status,
        startDate: startTimestamp,
        endDate: endTimestamp,
      });
      
      toast.success("Project created successfully!");
      router.push("/modules/projects");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create project. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto border rounded-lg p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Create New Project</h2>
        <p className="text-muted-foreground">
          Fill in the fields to create a new project.
        </p>
      </div>
      
      <div className="grid gap-6">
        {/* Project Name */}
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter project name"
          />
        </div>

        {/* Project Description */}
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="Enter project description (optional)"
          />
        </div>

        {/* Status */}
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as "planned" | "in_progress" | "completed" | "on_hold" | "canceled")}
          >
            <SelectTrigger>
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
        <div className="grid gap-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        {/* End Date */}
        <div className="grid gap-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>
      
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={() => router.push("/modules/projects")}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Project"
          )}
        </Button>
      </div>
    </div>
  );
}