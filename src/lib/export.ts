// /lib/export.ts

import { type Table } from "@tanstack/react-table";

interface ExportOptions<TData> {
  filename: string;
  excludeColumns?: string[];
}

export function exportTableToCSV<TData>(
  table: Table<TData>,
  { filename, excludeColumns = [] }: ExportOptions<TData>
) {
  // Extract headers (column names)
  const headers = table
    .getHeaderGroups()[0] // Use the first header group
    .headers.filter((header) => !excludeColumns.includes(header.id))
    .map((header) => header.column.id);

  // Extract rows (table data)
  const rows = table.getRowModel().rows.map((row) =>
    headers.map((headerId) => {
      const cellValue = row.getValue(headerId);
      return cellValue !== undefined && cellValue !== null
        ? `"${String(cellValue).replace(/"/g, '""')}"`
        : ""; // Handle special cases for CSV formatting
    })
  );

  // Build CSV content
  const csvContent = [
    headers.join(","), // Header row
    ...rows.map((row) => row.join(",")), // Data rows
  ].join("\n");

  // Trigger file download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
