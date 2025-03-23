"use client";

import * as React from "react";
import { ArrowUp, CheckCircle2, Download, Loader, Trash2, X } from "lucide-react";
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
                            <div className="flex items-center gap-1.5">
                                {/* Action Buttons */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="size-7 border"
                                            disabled={isPending || selectedRows.length === 0}
                                        >
                                            {isPending ? (
                                                <Loader className="size-3.5 animate-spin" aria-hidden="true" />
                                            ) : (
                                                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Update status</p>
                                    </TooltipContent>
                                </Tooltip>

                                {/* Bulk Delete Dialog */}
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