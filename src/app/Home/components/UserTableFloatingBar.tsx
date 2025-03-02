"use client";

import * as React from "react";
import { X } from "lucide-react";
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
import BulkDeleteDialog from "./CRUD/BulkDeleteDialog";

type UserTableFloatingBarProps = {
  table: any; // The React Table instance
  setSelectedRows: React.Dispatch<React.SetStateAction<Set<string>>>; // Prop for managing selected rows
};

export function UserTableFloatingBar({
  table,
  setSelectedRows,
}: UserTableFloatingBarProps) {
  const selectedRows = table.getSelectedRowModel().rows;
  console.log("Selected rows:", selectedRows);

  // Extract IDs from the selected rows
  const selectedUserIds = selectedRows
    .map((row: any) => row.original?._id)
    .filter(Boolean) as Id<"users">[]; // Remove invalid IDs

  console.log("Selected user IDs:", selectedUserIds);

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
                {/* BulkDeleteDialog for User Revocation */}
                <BulkDeleteDialog
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
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="size-3.5"
                            >
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <line x1="17" x2="22" y1="8" y2="13" />
                              <line x1="22" x2="17" y1="8" y2="13" />
                            </svg>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Revoke selected users</p>
                        </TooltipContent>
                      </Tooltip>
                    </Button>
                  }
                  title="Revoke User Access"
                  description="Are you sure you want to revoke access for the selected users? They will lose all access to the company and its resources."
                  selectedUserIds={selectedUserIds}
                  confirmText="Revoke Access"
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
