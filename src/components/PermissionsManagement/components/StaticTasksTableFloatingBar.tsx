"use client";

import * as React from "react";
import { CheckCircle2, Loader, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Portal } from "../../ui/portal";
import { Id } from "../../../../convex/_generated/dataModel";
import BulkDeletePermissionsDialog from "../CRUD/BulkDeletePermissionsDialog";

type StaticTasksTableFloatingBarProps = {
    table: any; // The React Table instance
    setSelectedRows: React.Dispatch<React.SetStateAction<Set<string>>>; // Prop for managing selected rows
};

export function StaticTasksTableFloatingBar({
    table,
    setSelectedRows,
}: StaticTasksTableFloatingBarProps) {
    const [isPending, setIsPending] = React.useState(false);

    const selectedRows = table.getSelectedRowModel().rows;
    console.log("Selected rows:", selectedRows);

    // Extract IDs
    const selectedRowIds = selectedRows
        .map((row: any) => row.original?._id)
        .filter(Boolean); // Remove invalid IDs

    console.log("Selected row IDs:", selectedRowIds);

    // Clear selected rows
    const handleClearSelection = () => {
        setSelectedRows(new Set());
        table.getRowModel().rows.forEach((row: any) => row.toggleSelected(false));
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
                                            disabled={isPending}
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

                                {/* BulkDeletePermissionsDialog */}
                                <BulkDeletePermissionsDialog
                                    triggerText={
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="size-7 border"
                                            disabled={selectedRows.length === 0} // Ensure this condition works as intended
                                        >
                                            <Trash2 className="size-3.5" aria-hidden="true" />
                                        </Button>
                                    }
                                    title="Delete Selected Permissions"
                                    description="Are you sure you want to delete the selected permissions? This action cannot be undone."
                                    selectedPermissionIds={selectedRowIds as Id<"permissions">[]}
                                    confirmText="Confirm Delete"
                                    onSuccess={handleClearSelection}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Portal>
        </TooltipProvider>
    );
}