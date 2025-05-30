"use client";

import * as React from "react";
import { ArrowUp, CheckCircle2, Download, Loader, Trash2, X, Activity, Flag, AlertTriangle } from "lucide-react";
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
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useState } from "react";
import BulkDeleteProjectsDialog from "./BulkDeleteProjectsDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ProjectsTableFloatingBarProps = {
    table: any; // The React Table instance
    setSelectedRows: React.Dispatch<React.SetStateAction<Set<string>>>; // Prop for managing selected rows
};

export function ProjectsTableFloatingBar({
    table,
    setSelectedRows,
}: ProjectsTableFloatingBarProps) {
    const [isPending, setIsPending] = React.useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const bulkDeleteProjects = useMutation(api.mutations.projects.bulkDeleteProjects);
    const bulkUpdateProjects = useMutation(api.mutations.projects.bulkUpdateProjects);

    const selectedRows = table.getSelectedRowModel().rows;

    // Extract IDs
    const selectedProjectIds = selectedRows
        .map((row: any) => row.original?._id)
        .filter(Boolean) as Id<"projects">[]; // Remove invalid IDs

    // Clear selected rows
    const handleClearSelection = () => {
        setSelectedRows(new Set());
        table.getRowModel().rows.forEach((row: any) => row.toggleSelected(false));
    };

    // Handle bulk delete
    const handleBulkDelete = async () => {
        if (selectedProjectIds.length === 0) {
            toast.error("No projects selected for deletion");
            return;
        }

        setIsPending(true);

        try {
            const result = await bulkDeleteProjects({ projectIds: selectedProjectIds });

            if (result.success) {
                toast.success(result.message || `Successfully deleted ${result.deletedCount} projects`);
                handleClearSelection();
                setIsDeleteDialogOpen(false);
            } else {
                toast.error(result.message || "Failed to delete projects");
            }
        } catch (error) {
            console.error("Error deleting projects:", error);
            toast.error("An error occurred while deleting projects");
        } finally {
            setIsPending(false);
        }
    };

    const handleBulkStatusUpdate = async (status: string) => {
        try {
            const result = await bulkUpdateProjects({
                projectIds: selectedProjectIds,
                updates: {
                    status: status as "planned" | "in_progress" | "completed" | "on_hold" | "canceled",
                },
            });

            if (result.success) {
                toast.success(result.message);
                handleClearSelection();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Failed to update projects");
            console.error("Error updating projects:", error);
        }
    };

    const handleBulkPriorityUpdate = async (priority: string) => {
        try {
            const result = await bulkUpdateProjects({
                projectIds: selectedProjectIds,
                updates: {
                    priority: priority as "low" | "medium" | "high" | "critical",
                },
            });

            if (result.success) {
                toast.success(result.message);
                handleClearSelection();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Failed to update projects");
            console.error("Error updating projects:", error);
        }
    };

    const handleBulkHealthUpdate = async (healthStatus: string) => {
        try {
            const result = await bulkUpdateProjects({
                projectIds: selectedProjectIds,
                updates: {
                    healthStatus: healthStatus as "on_track" | "at_risk" | "off_track",
                },
            });

            if (result.success) {
                toast.success(result.message);
                handleClearSelection();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Failed to update projects");
            console.error("Error updating projects:", error);
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
                                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate("planned")}>
                                        Planned
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
                                    <DropdownMenuItem onClick={() => handleBulkPriorityUpdate("critical")}>
                                        Critical
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            
                            {/* Health Update Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="h-7 w-7"
                                        disabled={selectedRows.length === 0}
                                    >
                                        <Activity className="h-3.5 w-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleBulkHealthUpdate("on_track")}>
                                        On Track
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleBulkHealthUpdate("at_risk")}>
                                        At Risk
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleBulkHealthUpdate("off_track")}>
                                        Off Track
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
                                            <AlertDialogTitle>Delete Selected Projects</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete {selectedProjectIds.length} selected projects?
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
                                                    "Delete Projects"
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