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
import UserSelect from "@/app/Home/components/userselect";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import TextareaWithLimit from "@/components/ModulesManagement/components/TextareaWithLimit";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface UpdateTaskDialogProps {
    taskId: Id<"tasks">;
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

export function UpdateTaskDialog({
    taskId,
    open,
    onOpenChange,
}: UpdateTaskDialogProps) {
    // Initialize form state
    const [formState, setFormState] = useState({
        taskName: "",
        description: "",
        status: "todo" as "todo" | "in_progress" | "completed" | "on_hold" | "canceled",
        priority: "medium" as "low" | "medium" | "high" | "urgent",
        assigneeId: "",
        dueDate: undefined as Date | undefined,
    });
    
    const [loading, setLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const lastInputRef = useRef<HTMLInputElement>(null);

    // Fetch task details
    const task = useQuery(api.queries.tasks.getTaskById, { taskId });
    const updateTask = useMutation(api.mutations.tasks.updateTask);
    const currentUser = useQuery(api.users.CurrentUser, {});

    // Fetch team members for the task's project
    const teamMembers = useQuery(
        api.queries.teams.fetchTeamMembersByProject,
        task?.projectId ? { projectId: task.projectId } : "skip"
    );

    // Fetch company users as fallback
    const companyUsers = useQuery(
        api.queries.users.fetchUsersByCompanyId,
        currentUser?.companyId && (!teamMembers || teamMembers.length === 0)
            ? { companyId: currentUser.companyId as Id<"companies"> }
            : "skip"
    );

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

    // Add state to track open dropdowns
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);

    // Populate form with task data when it's loaded
    useEffect(() => {
        if (task && !isInitialized) {
            console.log("Task data loaded:", task);
            
            setFormState({
                taskName: task.name,
                description: task.description || "",
                status: task.status,
                priority: task.priority,
                assigneeId: task.assigneeId || "",
                dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            });
            
            setIsInitialized(true);
        }
    }, [task, isInitialized]);

    // Reset initialization when dialog closes
    useEffect(() => {
        if (!open) {
            setIsInitialized(false);
        }
    }, [open]);

    // Add this effect to clean up any lingering popovers when the component unmounts
    useEffect(() => {
        return () => {
            // Force cleanup of any open popovers
            const popovers = document.querySelectorAll('[data-radix-popper-content-wrapper]');
            popovers.forEach(popover => {
                popover.remove();
            });
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.taskName.trim()) {
            toast.error("Please enter a task name");
            return;
        }

        if (!task?.projectId) {
            toast.error("Task project information is missing");
            return;
        }

        setLoading(true);

        try {
            // Use the Date object directly for the timestamp
            const dueDateTimestamp = formState.dueDate ? formState.dueDate.getTime() : undefined;

            await updateTask({
                taskId,
                name: formState.taskName,
                description: formState.description || undefined,
                assigneeId: formState.assigneeId ? formState.assigneeId as Id<"users"> : undefined,
                status: formState.status,
                priority: formState.priority,
                dueDate: dueDateTimestamp,
            });

            toast.success(`Task "${formState.taskName}" updated successfully!`);
            onOpenChange(false);
        } catch (error) {
            toast.error("Failed to update task. Please try again.");
            console.error("Failed to update task:", error);
        } finally {
            setLoading(false);
        }
    };

    // Update form state handlers
    const updateFormField = (field: string, value: any) => {
        setFormState(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Modify the onOpenChange handler to close all dropdowns when the sheet is closed
    const handleSheetOpenChange = (open: boolean) => {
        if (!open) {
            // Close all dropdowns before closing the sheet
            setStatusDropdownOpen(false);
            setPriorityDropdownOpen(false);
            
            // Small delay to ensure dropdowns are closed before the sheet closes
            setTimeout(() => {
                onOpenChange(open);
            }, 10);
        } else {
            onOpenChange(open);
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
                            <SheetTitle>Update Task</SheetTitle>
                            <SheetDescription>
                                Update the details of this task.
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    {task && isInitialized ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                {/* Task Name */}
                                <div className="flex items-center gap-4">
                                    <Label className="text-lg font-semibold w-32">Name</Label>
                                    <Input
                                        ref={lastInputRef}
                                        id="task-name"
                                        value={formState.taskName}
                                        onChange={(e) => updateFormField('taskName', e.target.value)}
                                        placeholder="Enter task name"
                                    />
                                </div>

                                {/* Description */}
                                <div className="flex items-center gap-4">
                                    <Label className="text-lg font-semibold w-32">Description</Label>
                                    <TextareaWithLimit
                                        id="description"
                                        value={formState.description}
                                        onChange={(value) => updateFormField('description', value)}
                                        maxLength={500}
                                        placeholder="Enter task description"
                                        className="w-full"
                                    />
                                </div>

                                {/* Status */}
                                <div className="flex items-center gap-4">
                                    <Label className="text-lg font-semibold w-32">Status</Label>
                                    <Select
                                        open={statusDropdownOpen}
                                        onOpenChange={setStatusDropdownOpen}
                                        value={formState.status}
                                        onValueChange={(value) => updateFormField('status', value)}
                                    >
                                        <SelectTrigger className="h-auto ps-2 w-full [&>span]:flex [&>span]:items-center [&>span]:gap-2">
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
                                <div className="flex items-center gap-4">
                                    <Label className="text-lg font-semibold w-32">Priority</Label>
                                    <Select
                                        open={priorityDropdownOpen}
                                        onOpenChange={setPriorityDropdownOpen}
                                        value={formState.priority}
                                        onValueChange={(value) => updateFormField('priority', value)}
                                    >
                                        <SelectTrigger className="h-auto ps-2 w-full [&>span]:flex [&>span]:items-center [&>span]:gap-2">
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

                                {/* Assignee */}
                                <div className="flex items-center gap-4">
                                    <Label className="text-lg font-semibold w-32">Assignee</Label>
                                    <div className="w-full">
                                        <UserSelect
                                            value={formState.assigneeId}
                                            onChange={(value) => updateFormField('assigneeId', value)}
                                            options={userOptions}
                                            label="Assignee"
                                        />
                                    </div>
                                </div>

                                {/* Due Date */}
                                <div className="flex flex-col gap-4">
                                    <Label className="text-lg font-semibold">Due Date</Label>
                                    <div className="w-full flex justify-center">
                                        <CalendarComponent
                                            mode="single"
                                            selected={formState.dueDate}
                                            onSelect={(date) => updateFormField('dueDate', date)}
                                            disabled={[{ before: new Date() }]}
                                            className="rounded-md"
                                            showOutsideDays={false}
                                            fixedWeeks={false}
                                            ISOWeek={false}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Updating..." : "Update Task"}
                            </Button>
                        </form>
                    ) : (
                        <div className="flex justify-center items-center h-40">
                            <p>Loading task details...</p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
} 