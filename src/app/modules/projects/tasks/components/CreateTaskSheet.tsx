"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardList, Trash, Calendar } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserSelect from "@/app/Home/components/userselect";
import { toast } from "sonner";
import { GenreInput } from "@/components/ModulesManagement/components/GenreInput";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import TextareaWithLimit from "@/components/ModulesManagement/components/TextareaWithLimit";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface CreateTaskSheetProps {
    projectId?: Id<"projects">;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const statusOptions = [
    { label: "To Do", value: "todo", color: "bg-gray-500" },
    { label: "In Progress", value: "in_progress", color: "bg-blue-500" },
    { label: "Completed", value: "completed", color: "bg-green-500" },
    { label: "On Hold", value: "on_hold", color: "bg-yellow-500" },
    { label: "Canceled", value: "canceled", color: "bg-red-500" },
];

const priorityOptions = [
    { label: "Low", value: "low", color: "bg-blue-400" },
    { label: "Medium", value: "medium", color: "bg-yellow-400" },
    { label: "High", value: "high", color: "bg-orange-400" },
    { label: "Urgent", value: "urgent", color: "bg-red-500" },
];

export function CreateTaskSheet({
    projectId,
    open,
    onOpenChange,
}: CreateTaskSheetProps) {
    const [taskName, setTaskName] = useState("");
    const [loading, setLoading] = useState(false);
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<"todo" | "in_progress" | "completed" | "on_hold" | "canceled">("todo");
    const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
    const [assigneeId, setAssigneeId] = useState("");
    // Change the dueDate state from string to Date | undefined
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
    const lastInputRef = useRef<HTMLInputElement>(null);

    const createTask = useMutation(api.mutations.tasks.createTask);
    const currentUser = useQuery(api.users.CurrentUser, {});

    // Fetch team members for the selected project
    const teamMembers = useQuery(
        api.queries.teams.fetchTeamMembersByProject,
        projectId ? { projectId } : "skip"
    );

    // Fetch company users as fallback if no project is selected or if team members query returns empty
    const companyUsers = useQuery(
        api.queries.users.fetchUsersByCompanyId,
        currentUser?.companyId && (!teamMembers || teamMembers.length === 0)
            ? { companyId: currentUser.companyId as Id<"companies"> }
            : "skip"
    );

    // Fetch projects for the dropdown if projectId is not provided
    const projects = useQuery(
        api.queries.projects.fetchProjectsByCompany,
        currentUser?.companyId ? { companyId: currentUser.companyId as Id<"companies"> } : "skip"
    );

    const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | undefined>(projectId);

    // Use team members if available, otherwise fall back to company users
    const userOptions = teamMembers?.length
        ? teamMembers.map(user => ({
            value: user._id,
            label: user.name || user.email,
            email: user.email,
            image: user.image
        }))
        : companyUsers?.map(user => ({
            value: user._id,
            label: user.name || user.email,
            email: user.email,
            image: user.image
        })) || [];

    // Reset assignee when project changes if the current assignee is not in the new team
    useEffect(() => {
        if (selectedProjectId && assigneeId) {
            const isAssigneeInTeam = userOptions.some(user => user.value === assigneeId);
            if (!isAssigneeInTeam) {
                setAssigneeId("");
            }
        }
    }, [selectedProjectId, userOptions, assigneeId]);

    // Add state to track open dropdowns
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
    const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);

    // Add cleanup effect for popovers
    useEffect(() => {
        return () => {
            // Force cleanup of any open popovers
            const popovers = document.querySelectorAll('[data-radix-popper-content-wrapper]');
            popovers.forEach(popover => {
                popover.remove();
            });
        };
    }, []);

    // Modify the onOpenChange handler to close all dropdowns when the sheet is closed
    const handleSheetOpenChange = (open: boolean) => {
        if (!open) {
            // Close all dropdowns before closing the sheet
            setStatusDropdownOpen(false);
            setPriorityDropdownOpen(false);
            setProjectDropdownOpen(false);
            
            // Small delay to ensure dropdowns are closed before the sheet closes
            setTimeout(() => {
                onOpenChange(open);
            }, 10);
        } else {
            onOpenChange(open);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskName.trim()) {
            toast.error("Please enter a task name");
            return;
        }

        if (!selectedProjectId) {
            toast.error("Please select a project");
            return;
        }

        if (!currentUser?._id) {
            toast.error("User not authenticated");
            return;
        }

        setLoading(true);

        try {
            // Use the Date object directly for the timestamp
            const dueDateTimestamp = dueDate ? dueDate.getTime() : undefined;

            await createTask({
                name: taskName,
                projectId: selectedProjectId,
                description: description || undefined,
                assigneeId: assigneeId ? assigneeId as Id<"users"> : undefined,
                status,
                priority,
                dueDate: dueDateTimestamp,
            });

            toast.success(`Task "${taskName}" created successfully!`);

            // Reset form
            setTaskName("");
            setDescription("");
            setStatus("todo");
            setPriority("medium");
            setAssigneeId("");
            setDueDate(undefined);
            if (!projectId) {
                setSelectedProjectId(undefined);
            }
            onOpenChange(false);
        } catch (error) {
            toast.error("Failed to create task. Please try again.");
            console.error("Failed to create task:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={handleSheetOpenChange}>
            <SheetContent
                className="overflow-y-auto sm:max-w-md md:max-w-lg lg:max-w-xl"
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    lastInputRef.current?.focus();
                }}
                onPointerDownOutside={(e) => {
                    // Prevent closing the sheet when clicking on the date picker
                    const target = e.target as HTMLElement;
                    if (target.closest('.react-calendar') || target.closest('[data-radix-popper-content-wrapper]')) {
                        e.preventDefault();
                    }
                }}
            >
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-2">
                        <div
                            className="flex size-10 shrink-0 items-center justify-center rounded-full border"
                            aria-hidden="true"
                        >
                            <ClipboardList className="opacity-80" size={16} />
                        </div>
                        <SheetHeader>
                            <SheetTitle>Create Task</SheetTitle>
                            <SheetDescription>
                                Create a new task for your project.
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Information Section */}
                        <div className="space-y-4">
                            <div className="mb-2">
                                <h3 className="text-lg font-bold">Basic Information</h3>
                                <p className="text-muted-foreground text-sm">
                                    Enter the core details of your task.
                                </p>
                            </div>
                            
                            {/* Task Name */}
                            <div className="space-y-2">
                                <Label htmlFor="task-name" className="text-sm font-medium">Name</Label>
                                <Input
                                    ref={lastInputRef}
                                    id="task-name"
                                    value={taskName}
                                    onChange={(e) => setTaskName(e.target.value)}
                                    placeholder="Enter task name"
                                />
                            </div>

                            {/* Project Selection (only if projectId is not provided) */}
                            {!projectId && (
                                <div className="space-y-2">
                                    <Label htmlFor="project" className="text-sm font-medium">Project</Label>
                                    <Select
                                        open={projectDropdownOpen}
                                        onOpenChange={setProjectDropdownOpen}
                                        value={selectedProjectId || ""}
                                        onValueChange={(value) => {
                                            setSelectedProjectId(value as Id<"projects">);
                                            // Reset assignee when project changes
                                            setAssigneeId("");
                                        }}
                                    >
                                        <SelectTrigger id="project" className="w-full">
                                            <SelectValue placeholder="Select a project" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projects?.map((project) => (
                                                <SelectItem key={project._id} value={project._id}>
                                                    {project.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                                <TextareaWithLimit
                                    id="description"
                                    value={description}
                                    onChange={setDescription}
                                    maxLength={500}
                                    placeholder="Enter task description"
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Status and Priority Section */}
                        <div className="space-y-4 pt-2 border-t">
                            <div className="mb-2">
                                <h3 className="text-lg font-bold">Status and Priority</h3>
                                <p className="text-muted-foreground text-sm">
                                    Set the current status and importance level of this task.
                                </p>
                            </div>
                            
                            {/* Status */}
                            <div className="space-y-2">
                                <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                                <Select
                                    open={statusDropdownOpen}
                                    onOpenChange={setStatusDropdownOpen}
                                    value={status}
                                    onValueChange={(value) => setStatus(value as "todo" | "in_progress" | "completed" | "on_hold" | "canceled")}
                                >
                                    <SelectTrigger id="status" className="h-auto ps-2 w-full [&>span]:flex [&>span]:items-center [&>span]:gap-2">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                <span className={`inline-block w-2 h-2 rounded-full ${option.color} mr-2`}></span>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Priority */}
                            <div className="space-y-2">
                                <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
                                <Select
                                    open={priorityDropdownOpen}
                                    onOpenChange={setPriorityDropdownOpen}
                                    value={priority}
                                    onValueChange={(value) => setPriority(value as "low" | "medium" | "high" | "urgent")}
                                >
                                    <SelectTrigger id="priority" className="h-auto ps-2 w-full [&>span]:flex [&>span]:items-center [&>span]:gap-2">
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {priorityOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                <span className={`inline-block w-2 h-2 rounded-full ${option.color} mr-2`}></span>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Assignment and Timeline Section */}
                        <div className="space-y-4 pt-2 border-t">
                            <div className="mb-2">
                                <h3 className="text-lg font-bold">Assignment and Timeline</h3>
                                <p className="text-muted-foreground text-sm">
                                    Assign the task to a team member and set a due date.
                                </p>
                            </div>
                            
                            {/* Assignee */}
                            <div className="space-y-2">
                                <UserSelect
                                    value={assigneeId}
                                    onChange={setAssigneeId}
                                    options={userOptions}
                                    label="Assignee"
                                />
                            </div>
                            
                            {/* Due Date */}
                            <div className="space-y-2">
                                <Label htmlFor="due-date" className="text-sm font-medium">Due Date</Label>
                                <div className="w-full flex justify-center">
                                    <CalendarComponent
                                        mode="single"
                                        selected={dueDate}
                                        onSelect={setDueDate}
                                        disabled={[{ before: new Date() }]}
                                        className="rounded-md border shadow-sm"
                                        showOutsideDays={false}
                                        fixedWeeks={false}
                                        ISOWeek={false}
                                    />
                                </div>
                                {dueDate && (
                                    <p className="text-sm text-muted-foreground text-center">
                                        Selected date: {format(dueDate, "PPP")}
                                    </p>
                                )}
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Creating..." : "Create Task"}
                        </Button>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    );
}