"use client";

import * as React from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Portal } from "@/components/ui/portal";
import { Id } from "../../../../convex/_generated/dataModel";
import BulkDeleteTeamsDialog from "./CRUD/BulkDeleteTeamsDialog"; // Update this line

type TeamTableFloatingBarProps = {
  table: any; // The React Table instance
  setSelectedRows: React.Dispatch<React.SetStateAction<Set<string>>>; // Prop for managing selected rows
};

export function TeamTableFloatingBar({
  table,
  setSelectedRows,
}: TeamTableFloatingBarProps) {
  const selectedRows = table.getSelectedRowModel().rows;
  console.log("Selected rows:", selectedRows);

  // Extract IDs from the selected rows
  const selectedTeamIds = selectedRows
    .map((row: any) => row.original?._id)
    .filter(Boolean) as Id<"teams">[]; // Remove invalid IDs

  console.log("Selected team IDs:", selectedTeamIds);

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
                {/* BulkDeleteTeamsDialog for Team Deletion */}
                <BulkDeleteTeamsDialog
                  triggerText={
                    <Button
                      variant="secondary"
                      size="icon"
                      className="size-7 border"
                      disabled={selectedRows.length === 0}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center justify-center">
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete selected teams</p>
                        </TooltipContent>
                      </Tooltip>
                    </Button>
                  }
                  title="Delete Teams"
                  description="Are you sure you want to delete the selected teams? This action cannot be undone."
                  selectedTeamIds={selectedTeamIds}
                  teamIds={selectedTeamIds}
                  confirmText="Delete Teams"
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
