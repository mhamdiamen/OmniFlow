"use client";

import { useState, useEffect, useRef } from "react";
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
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { DateRangePicker } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";
import BlockEditor from "@/components/BlockEditor";
import { GenreInput } from "@/components/ModulesManagement/components/GenreInput";
import { Tag } from "emblor";

// Import the RadioGroups component and necessary icons
import { RadioGroups } from "../components/RadioGroups";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export default function CreateProjectPage() {
  const router = useRouter();
  const createProject = useMutation(api.mutations.projects.createProject);
  const currentUserQuery = useQuery(api.users.CurrentUser);
  const currentUser = currentUserQuery;

  // Fetch teams for the company
  const teamsQuery = useQuery(
    api.queries.teams.fetchTeamsByCompany,
    currentUser?.companyId ? { companyId: currentUser.companyId as Id<"companies"> } : "skip"
  );

  // Form state for the project.
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [status, setStatus] = useState<"planned" | "in_progress" | "completed" | "on_hold" | "canceled">("planned");
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(undefined);
  
  // New state for additional fields
  const [category, setCategory] = useState<string>("");
  // Update tags state to use Tag type from emblor
  const [tags, setTags] = useState<Tag[]>([]);
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [projectHealthStatus, setProjectHealthStatus] = useState<"on_track" | "at_risk" | "off_track">("on_track");

  // State for the BlockEditor
  const [initialContent, setInitialContent] = useState<string>("");
  const contentRef = useRef<string>(""); // Use a ref to track the current content

  // Default template for new project descriptions - store as string instead of stringified JSON
  const defaultTemplate = `[
    {
      "id": "1",
      "type": "heading",
      "props": { "textColor": "default", "backgroundColor": "default", "textAlignment": "left", "level": 1 },
      "content": [{ "type": "text", "text": "Project Overview", "styles": {} }],
      "children": []
    },
    {
      "id": "2",
      "type": "paragraph",
      "props": { "textColor": "default", "backgroundColor": "default", "textAlignment": "left" },
      "content": [{ "type": "text", "text": "Describe the main purpose and goals of this project.", "styles": {} }],
      "children": []
    },
    {
      "id": "3",
      "type": "heading",
      "props": { "textColor": "default", "backgroundColor": "default", "textAlignment": "left", "level": 2 },
      "content": [{ "type": "text", "text": "Objectives", "styles": {} }],
      "children": []
    },
    {
      "id": "4",
      "type": "bulletListItem",
      "props": { "textColor": "default", "backgroundColor": "default", "textAlignment": "left" },
      "content": [{ "type": "text", "text": "Key objective 1", "styles": {} }],
      "children": []
    },
    {
      "id": "5",
      "type": "bulletListItem",
      "props": { "textColor": "default", "backgroundColor": "default", "textAlignment": "left" },
      "content": [{ "type": "text", "text": "Key objective 2", "styles": {} }],
      "children": []
    },
    {
      "id": "6",
      "type": "heading",
      "props": { "textColor": "default", "backgroundColor": "default", "textAlignment": "left", "level": 2 },
      "content": [{ "type": "text", "text": "Key Deliverables", "styles": {} }],
      "children": []
    },
    {
      "id": "7",
      "type": "paragraph",
      "props": { "textColor": "default", "backgroundColor": "default", "textAlignment": "left" },
      "content": [{ "type": "text", "text": "List the main deliverables for this project.", "styles": {} }],
      "children": []
    }
  ]`;

  // Date range state
  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: today,
    to: undefined
  });

  // After your state declarations, add this effect to load from localStorage
  useEffect(() => {
    // Load saved form data from localStorage on component mount
    const savedFormData = localStorage.getItem('projectFormData');
    
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setProjectName(parsedData.name || '');
        setStatus(parsedData.status || 'planned');
        setSelectedTeamId(parsedData.teamId || undefined);
        
        // Load new fields from localStorage
        setCategory(parsedData.category || '');
        
        // Convert string array to Tag array if needed
        if (parsedData.tags) {
          if (Array.isArray(parsedData.tags)) {
            if (parsedData.tags.length > 0 && typeof parsedData.tags[0] === 'string') {
              // Convert string array to Tag array
              setTags(parsedData.tags.map((tag: string) => ({ id: crypto.randomUUID(), text: tag })));
            } else {
              // Already in Tag format
              setTags(parsedData.tags);
            }
          }
        }
        
        setPriority(parsedData.priority || 'medium');
        setProjectHealthStatus(parsedData.healthStatus || 'on_track');

        // Set the initial content for the BlockEditor
        if (parsedData.description) {
          setInitialContent(parsedData.description);
          contentRef.current = parsedData.description;
        } else {
          // Use the default template if no saved description
          setInitialContent(defaultTemplate);
          contentRef.current = defaultTemplate;
        }

        // Restore date range if available
        if (parsedData.dateRange) {
          const restoredDateRange: DateRange = {
            from: parsedData.dateRange.from ? new Date(parsedData.dateRange.from) : today,
            to: parsedData.dateRange.to ? new Date(parsedData.dateRange.to) : undefined
          };
          setDateRange(restoredDateRange);
        }
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    } else {
      // No saved form data, use the default template
      console.log("Using default template");
      setInitialContent(defaultTemplate);
      contentRef.current = defaultTemplate;
    }
  }, []);

  const [isSaving, setIsSaving] = useState(false);

  // Handle content changes from the BlockEditor
  const handleContentChange = (content: string) => {
    contentRef.current = content; // Update the ref with the latest content

    // Update localStorage with the latest form data including the new content
    const formData = {
      name: projectName,
      description: content,
      status,
      teamId: selectedTeamId,
      category,
      tags,
      priority,
      healthStatus: projectHealthStatus,
      dateRange: {
        from: dateRange?.from?.getTime(),
        to: dateRange?.to?.getTime()
      }
    };

    localStorage.setItem('projectFormData', JSON.stringify(formData));
  };

  // Add this effect to save to localStorage whenever form data changes
  useEffect(() => {
    // Save form data to localStorage whenever it changes
    const formData = {
      name: projectName,
      description: contentRef.current,
      status,
      teamId: selectedTeamId,
      category,
      tags,
      priority,
      healthStatus: projectHealthStatus,
      dateRange: {
        from: dateRange?.from?.getTime(),
        to: dateRange?.to?.getTime()
      }
    };

    localStorage.setItem('projectFormData', JSON.stringify(formData));
  }, [projectName, status, selectedTeamId, category, tags, priority, projectHealthStatus, dateRange]);

  const handleSave = async () => {
    if (!projectName.trim()) {
      toast.error("Project name is required.");
      return;
    }

    if (!currentUser) {
      toast.error("User not authenticated.");
      return;
    }

    if (!dateRange?.from) {
      toast.error("Start date is required.");
      return;
    }

    try {
      setIsSaving(true);

      // Convert dates to timestamps
      const startTimestamp = dateRange.from.getTime();
      const endTimestamp = dateRange.to ? dateRange.to.getTime() : undefined;

      // Extract tag text values from Tag objects
      const tagValues = tags.map(tag => tag.text);

      await createProject({
        name: projectName.trim(),
        description: contentRef.current || undefined, // Use the BlockEditor content
        companyId: currentUser.companyId as Id<"companies">,
        teamId: selectedTeamId ? selectedTeamId as Id<"teams"> : undefined,
        status,
        // Include new fields
        category: category.trim() || undefined,
        tags: tagValues.length > 0 ? tagValues : undefined,
        priority,
        healthStatus: projectHealthStatus,
        // Progress tracking fields are initialized on the server
        startDate: startTimestamp,
        endDate: endTimestamp,
      });

      // Clear the saved form data after successful submission
      localStorage.removeItem('projectFormData');

      toast.success("Project created successfully!");
      router.push("/modules/projects");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create project. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Define health status options for RadioGroups
  const healthStatusOptions = [
    { value: "on_track", label: "On Track", Icon: CheckCircle },
    { value: "at_risk", label: "At Risk", Icon: AlertTriangle },
    { value: "off_track", label: "Off Track", Icon: XCircle },
  ];

  return (
    <AdminPanelLayout>
      <ContentLayout title="Create New Project">
        <div className="flex justify-between items-center mb-6 w-full">
          <div>
            <h2 className="text-2xl font-bold">Create New Project</h2>
            <p className="text-muted-foreground">
              Fill in the fields to create a new project.
            </p>
          </div>
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

        <div className="w-full ml-0 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left column - Form fields */}
            <div className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="mb-2">
                  <h3 className="text-lg font-bold">Basic Information</h3>
                  <p className="text-muted-foreground text-sm">
                    Enter the core details of your project.
                  </p>
                </div>
                
                {/* Project Name */}
                <div className="flex items-center gap-4">
                  <Label htmlFor="name" className="w-32 font-bold">Name</Label>
                  <Input
                    id="name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className="flex-1"
                  />
                </div>

                {/* Team Selection */}
                <div className="flex items-center gap-4">
                  <Label htmlFor="team" className="w-32 font-bold">Team</Label>
                  <Select
                    value={selectedTeamId}
                    onValueChange={(value) => setSelectedTeamId(value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a team (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamsQuery && teamsQuery.length > 0 ? (
                        teamsQuery.map((team) => (
                          <SelectItem key={team._id} value={team._id}>
                            {team.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-teams" disabled>
                          No teams available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Category */}
                <div className="flex items-center gap-4">
                  <Label htmlFor="category" className="w-32 font-bold">Category</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Enter project category"
                    className="flex-1"
                  />
                </div>
                
                {/* Tags */}
                <div className="flex items-start gap-4">
                  <Label htmlFor="tags" className="w-32 font-bold pt-2">Tags</Label>
                  <div className="flex-1">
                    <GenreInput
                      id="project-tags"
                      initialTags={tags}
                      placeholder="Add project tags..."
                      onTagsChange={setTags}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              
              {/* Project Status Section */}
              <div className="space-y-4 pt-2">
                <div className="mb-2">
                  <h3 className="text-lg font-bold">Project Status</h3>
                  <p className="text-muted-foreground text-sm">
                    Define the current state and importance of the project.
                  </p>
                </div>
                
                {/* Status */}
                <div className="flex items-center gap-4">
                  <Label htmlFor="status" className="w-32 font-bold">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as "planned" | "in_progress" | "completed" | "on_hold" | "canceled")}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
                          <span>Planned</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="in_progress">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                          <span>In Progress</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-purple-500 flex-shrink-0"></div>
                          <span>Completed</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="on_hold">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0"></div>
                          <span>On Hold</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="canceled">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></div>
                          <span>Canceled</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="flex items-center gap-4">
                  <Label htmlFor="priority" className="w-32 font-bold">Priority</Label>
                  <Select
                    value={priority}
                    onValueChange={(value) => setPriority(value as "low" | "medium" | "high" | "critical")}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-400 flex-shrink-0"></div>
                          <span>Low</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-400 flex-shrink-0"></div>
                          <span>Medium</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-orange-400 flex-shrink-0"></div>
                          <span>High</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="critical">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></div>
                          <span>Critical</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Health Status */}
                <div className="flex items-start gap-4">
                  <Label htmlFor="healthStatus" className="w-32 font-bold pt-2">Health Status</Label>
                  <div className="flex-1">
                    <RadioGroups
                      items={healthStatusOptions}
                      value={projectHealthStatus}
                      onChange={(value) => setProjectHealthStatus(value as "on_track" | "at_risk" | "off_track")}
                      className="grid grid-cols-3 w-full"
                    />
                  </div>
                </div>
              </div>
              
              {/* Timeline Section */}
              <div className="space-y-4 pt-2">
                <div className="mb-2">
                  <h3 className="text-lg font-bold">Project Timeline</h3>
                  <p className="text-muted-foreground text-sm">
                    Set the start and end dates for your project.
                  </p>
                </div>
                
                {/* Date Range */}
                <div className="flex items-center gap-4">
                  <Label htmlFor="dateRange" className="w-32 font-bold">Project Dates</Label>
                  <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    placeholder="Select start and end dates"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Right column - BlockEditor */}
            <div className="flex flex-col h-[1024px]"> {/* A4 height in pixels (approximately) */}
              <div className="mb-4">
                <h3 className="text-lg font-bold">Project Description</h3>
                <p className="text-muted-foreground text-sm">
                  Provide detailed information about the project, including goals, requirements, and any other relevant details.
                </p>
              </div>
              <div className="border rounded-md flex-grow overflow-hidden shadow-sm scrollbar-hide">
                <BlockEditor
                  initialContent={initialContent}
                  onChange={handleContentChange}
                  editable={true}
                />
              </div>
            </div>
          </div>
        </div>
      </ContentLayout>
    </AdminPanelLayout>
  );
}
