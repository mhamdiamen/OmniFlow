"use client";

import * as React from "react";
import { ArrowUp, CheckCircle2, Download, Loader, Trash2, X, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Portal } from "@/components/ui/portal";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TasksTableFloatingBarProps = {
    table: any; // The React Table instance
    setSelectedRows: React.Dispatch<React.SetStateAction<Set<string>>>; // Prop for managing selected rows
};

export function TasksTableFloatingBar({
    table,
    setSelectedRows,
}: TasksTableFloatingBarProps) {
    const [isPending, setIsPending] = React.useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const bulkDeleteTasks = useMutation(api.mutations.tasks.bulkDeleteTasks);
    const bulkUpdateTasks = useMutation(api.mutations.tasks.bulkUpdateTasks);

    const selectedRows = table.getSelectedRowModel().rows;

    // Extract IDs
    const selectedTaskIds = selectedRows
        .map((row: any) => row.original?._id)
        .filter(Boolean) as Id<"tasks">[]; // Remove invalid IDs

    // Clear selected rows
    const handleClearSelection = () => {
        setSelectedRows(new Set());
        table.getRowModel().rows.forEach((row: any) => row.toggleSelected(false));
    };

    // Handle bulk delete
    const handleBulkDelete = async () => {
        if (selectedTaskIds.length === 0) {
            toast.error("No tasks selected for deletion");
            return;
        }

        setIsPending(true);

        try {
            const result = await bulkDeleteTasks({ taskIds: selectedTaskIds });

            if (result.success) {
                toast.success(`Successfully deleted ${result.deletedCount} tasks`);
                handleClearSelection();
                setIsDeleteDialogOpen(false);
            } else {
                toast.error("Failed to delete tasks");
            }
        } catch (error) {
            console.error("Error deleting tasks:", error);
            toast.error("An error occurred while deleting tasks");
        } finally {
            setIsPending(false);
        }
    };

    const handleBulkStatusUpdate = async (status: string) => {
        try {
            const result = await bulkUpdateTasks({
                taskIds: selectedTaskIds,
                updates: {
                    status: status as "todo" | "in_progress" | "completed" | "on_hold" | "canceled",
                },
            });

            if (result.success) {
                toast.success(`Successfully updated ${result.updatedCount} tasks`);
                handleClearSelection();
            } else {
                toast.error("Failed to update tasks");
            }
        } catch (error) {
            toast.error("Failed to update tasks");
            console.error("Error updating tasks:", error);
        }
    };

    const handleBulkPriorityUpdate = async (priority: string) => {
        try {
            const result = await bulkUpdateTasks({
                taskIds: selectedTaskIds,
                updates: {
                    priority: priority as "low" | "medium" | "high" | "urgent",
                },
            });

            if (result.success) {
                toast.success(`Successfully updated ${result.updatedCount} tasks`);
                handleClearSelection();
            } else {
                toast.error("Failed to update tasks");
            }
        } catch (error) {
            toast.error("Failed to update tasks");
            console.error("Error updating tasks:", error);
        }
    };

    return (
        <TooltipProvider>
            <Portal>
                <div className="fixed inset-x-0 bottom-6 z-50 mx-auto w-fit px-2.5">
                    <div className="w-full overflow-x-auto">
                        <div className="mx-auto flex w-fit items-center gap-2 rounded-md border bg-background p-2 text-foreground shadow">
                            <div className="flex h-7 items-center rounded-md border border-dashed pl-2.5 pr-1">
                                <span className="whitespace-nowrap text-xs">
                                    {selectedRows.length} selected
                                </span>
                                <Separator orientation="vertical" className="ml-2 mr-1" />
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-5 hover:border"
                                            onClick={handleClearSelection}
                                        >
                                            <X className="size-3.5 shrink-0" aria-hidden="true" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Clear selection</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <Separator orientation="vertical" className="hidden h-5 sm:block" />
                            
                            {/* Status Update Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="h-7 w-7"
                                        disabled={selectedRows.length === 0}
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate("todo")}>
                                        To Do
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate("in_progress")}>
                                        In Progress
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate("completed")}>
                                        Completed
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate("on_hold")}>
                                        On Hold
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate("canceled")}>
                                        Canceled
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            
                            {/* Priority Update Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="h-7 w-7"
                                        disabled={selectedRows.length === 0}
                                    >
                                        <Flag className="h-3.5 w-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleBulkPriorityUpdate("low")}>
                                        Low
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleBulkPriorityUpdate("medium")}>
                                        Medium
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleBulkPriorityUpdate("high")}>
                                        High
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleBulkPriorityUpdate("urgent")}>
                                        Urgent
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            
                            <Separator orientation="vertical" className="hidden h-5 sm:block" />
                            <div className="flex items-center gap-1.5">
                                {/* Delete Button */}
                                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="size-7 border"
                                            disabled={selectedRows.length === 0 || isPending}
                                        >
                                            <Trash2 className="size-3.5" aria-hidden="true" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Selected Tasks</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete {selectedTaskIds.length} selected tasks?
                                                This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleBulkDelete();
                                                }}
                                                disabled={isPending}
                                            >
                                                {isPending ? (
                                                    <>
                                                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                                                        Deleting...
                                                    </>
                                                ) : (
                                                    "Delete Tasks"
                                                )}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </div>
                </div>
            </Portal>
        </TooltipProvider>
    );
}