"use client";

import React from "react";
import { type Table } from "@tanstack/react-table";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { exportTableToCSV } from "@/lib/export";

interface ExportButtonProps<TData> {
  table: Table<TData>;
  filename: string;
  excludeColumns?: string[];
  label?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function ExportButton<TData>({
  table,
  filename,
  excludeColumns = [],
  label = "Export",
  icon = <Download className="size-4" aria-hidden="true" />,
  className = "",
}: ExportButtonProps<TData>) {
  return (
    <Button
      variant="outline" // Matches the TableViewOptions button
      size="sm" // Matches the TableViewOptions button size
      onClick={() =>
        exportTableToCSV(table, {
          filename,
          excludeColumns,
        })
      }
      className={`h-8 gap-2 focus:outline-none focus:ring-1 focus:ring-ring focus-visible:ring-0 ${className}`} // Ensure the same height and spacing as TableViewOptions
    >
      {icon}
      {label}
    </Button>
  );
}
