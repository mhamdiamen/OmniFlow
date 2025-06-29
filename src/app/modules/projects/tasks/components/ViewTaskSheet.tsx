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
import { Label } from "@/components/ui/label";
import { ClipboardList, Calendar, Flag, CheckCircle2, User, Info, UsersRound, MessageSquare } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/dateUtils";
import { CommentsTab } from "../../components/CommentsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Subtasks } from "./SubTasks";

interface ViewTaskSheetProps {
    taskId: Id<"tasks"> | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ViewTaskSheet({
    taskId,
    open,
    onOpenChange,
}: ViewTaskSheetProps) {
    // Fetch task details
    const task = useQuery(
        api.queries.tasks.getTaskById,
        taskId ? { taskId } : "skip"
    );
    const updateTask = useMutation(api.mutations.tasks.updateTask);

    // Status color mapping
    const statusColors: Record<string, string> = {
        "todo": "bg-gray-500",
        "in_progress": "bg-blue-500",
        "completed": "bg-green-500",
        "on_hold": "bg-yellow-500",
        "canceled": "bg-red-500"
    };

    // Status label mapping
    const statusLabels: Record<string, string> = {
        "todo": "To Do",
        "in_progress": "In Progress",
        "completed": "Completed",
        "on_hold": "On Hold",
        "canceled": "Canceled"
    };

    // Priority color mapping
    const priorityColors: Record<string, string> = {
        "low": "bg-blue-400",
        "medium": "bg-yellow-400",
        "high": "bg-orange-400",
        "urgent": "bg-red-500"
    };

    // Priority label mapping
    const priorityLabels: Record<string, string> = {
        "low": "Low",
        "medium": "Medium",
        "high": "High",
        "urgent": "Urgent"
    };

    const handleToggleSubtask = async (taskId: Id<"tasks">, subtaskId: Id<"subtasks">) => {
        try {
            await updateTask({
                taskId,
                updatedSubtaskId: subtaskId
            });
        } catch (error) {
            console.error("Failed to toggle subtask:", error);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="overflow-y-auto sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
                <SheetHeader className="pb-4">
                    <SheetTitle className="flex items-center gap-2 text-2xl font-bold">
                        <ClipboardList className="h-6 w-6" />
                        Task Details
                    </SheetTitle>
                    <SheetDescription>
                        View task details and information
                    </SheetDescription>
                </SheetHeader>

                {task ? (
                    <div className="space-y-4 py-4">
                        {/* Project Name (if available) */}
                        {task.projectDetails && (
                            <div className="text-sm text-muted-foreground font-medium mb-1">
                                {task.projectDetails.name}'s task
                            </div>
                        )}

                        {/* Task Name Headline */}
                        <h1 className="text-3xl font-bold tracking-tight mt-0">{task.name}</h1>

                        {/* Task Details Group */}
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <Info className="h-8 w-8" />
                                <div>
                                    <h3 className="text-lg font-semibold">Task Information</h3>
                                    <p className="text-sm text-muted-foreground">View and manage the core details of your task</p>
                                </div>
                            </div>
                            <div className="space-y-4 p-4">
                                {/* Description */}
                                {task.description && (
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-lg font-semibold">Description</Label>
                                        <p className="text-sm text-muted-foreground rounded-md border p-4 bg-muted/30 whitespace-pre-wrap">
                                            {task.description}
                                        </p>
                                    </div>
                                )}
                                {/* Status */}
                                <div className="flex items-center gap-4">
                                    <Label className="text-sm w-32 flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Status
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${statusColors[task.status] || "bg-gray-500"} flex-shrink-0`}></div>
                                        <span className="text-sm font-bold">{statusLabels[task.status] || task.status}</span>
                                    </div>
                                </div>

                                {/* Priority */}
                                <div className="flex items-center gap-4">
                                    <Label className="text-sm w-32 flex items-center gap-2">
                                        <Flag className="h-4 w-4" />
                                        Priority
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${priorityColors[task.priority] || "bg-gray-400"} flex-shrink-0`}></div>
                                        <span className="text-sm font-bold">{priorityLabels[task.priority] || task.priority}</span>
                                    </div>
                                </div>

                                {/* Due Date */}
                                <div className="flex items-center gap-4">
                                    <Label className="text-sm w-32 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Due Date
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        {task.dueDate ? (
                                            <span className={`text-sm ${task.dueDate < Date.now() && task.status !== "completed" ? "text-red-500 font-medium" : ""}`}>
                                                {formatDate(task.dueDate)}
                                                {task.dueDate < Date.now() && task.status !== "completed" && " (Overdue)"}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">Not set</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* People Group */}
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <UsersRound className="h-8 w-8" />
                                <div>
                                    <h3 className="text-lg font-semibold">People</h3>
                                    <p className="text-sm text-muted-foreground">Team members involved in this task</p>
                                </div>
                            </div>
                            <div className="space-y-4 p-4">
                                {/* Assignee */}
                                <div className="flex items-center gap-4">
                                    <Label className="text-sm w-32 flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Assignee
                                    </Label>
                                    {task.assigneeDetails ? (
                                        <div className="flex items-center space-x-2">
                                            <Avatar className="h-8 w-8 border-2">
                                                {task.assigneeDetails.image ? (
                                                    <AvatarImage
                                                        src={task.assigneeDetails.image}
                                                        alt={task.assigneeDetails.name || task.assigneeDetails.email}
                                                    />
                                                ) : null}
                                                <AvatarFallback>
                                                    {task.assigneeDetails.email?.[0]?.toUpperCase() || task.assigneeDetails.name?.[0]?.toUpperCase() || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{task.assigneeDetails.name || task.assigneeDetails.email}</span>
                                                {task.assigneeDetails.name && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {task.assigneeDetails.email}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">Unassigned</span>
                                    )}
                                </div>

                                {/* Created By */}
                                {task.creatorDetails && (
                                    <div className="flex items-center gap-4">
                                        <Label className="text-sm w-32 flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Created By
                                        </Label>
                                        <div className="flex items-center space-x-2">
                                            <Avatar className="h-8 w-8 border-2">
                                                {task.creatorDetails.image ? (
                                                    <AvatarImage
                                                        src={task.creatorDetails.image}
                                                        alt={task.creatorDetails.name || task.creatorDetails.email}
                                                    />
                                                ) : null}
                                                <AvatarFallback>
                                                    {task.creatorDetails.email?.[0]?.toUpperCase() || task.creatorDetails.name?.[0]?.toUpperCase() || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{task.creatorDetails.name || task.creatorDetails.email}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(task._creationTime), "PPP")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div className="mt-8 border-t pt-6 space-y-4">
                            {/* Header section above tabs */}
                            <div className="flex items-center gap-4">
                                <MessageSquare className="h-8 w-8" />
                                <div>
                                    <h3 className="text-lg font-semibold">Task Discussions</h3>
                                    <p className="text-sm text-muted-foreground">Collaborate with your team</p>
                                </div>
                            </div>

                            {/* Tabs section below header */}
                            <Tabs defaultValue="subtasks" className="w-full">
                                <TabsList className="grid grid-cols-4 w-full mb-4">
                                    <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
                                    <TabsTrigger value="comments">Comments</TabsTrigger>
                                    <TabsTrigger value="activity">Activity</TabsTrigger>
                                    <TabsTrigger value="attachments">Attachments</TabsTrigger>
                                </TabsList>

                                <TabsContent value="subtasks">
                                    {task.subtasks && task.subtasks.length > 0 ? (
                                        <Subtasks
                                            taskId={taskId!}
                                            subtasks={task.subtasks}
                                            onToggleSubtask={handleToggleSubtask}
                                        />
                                    ) : (
                                        <div className="py-6 px-4 bg-muted/30 rounded-md text-center text-sm text-muted-foreground">
                                            No subtasks defined for this task.
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="comments">
                                    {taskId && (
                                        <CommentsTab
                                            targetId={taskId}
                                            targetType="task"
                                        />
                                    )}
                                </TabsContent>

                                <TabsContent value="activity">
                                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                        <p>Activity log will appear here</p>
                                    </div>
                                </TabsContent>

                                <TabsContent value="attachments">
                                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                        <p>File attachments will appear here</p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                ) : (
                    // Loading state
                    <div className="space-y-6 py-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-6 w-full" />
                            </div>
                        ))}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}