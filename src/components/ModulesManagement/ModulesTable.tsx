"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  flexRender,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableColumnHeader } from "./datatable/DataTableColumnHeader";
import { getCommonPinningStyles } from "@/lib/data-table";
import { Checkbox } from "../ui/checkbox";
import { StaticTasksTableFloatingBar } from "./components/StaticTasksTableFloatingBar";
import { TableViewOptions } from "./datatable/DataTableViewOptions";
import { ExportButton } from "../ui/ExportButton";
import { Badge } from "../ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { DataTablePagination } from "./datatable/DataTablePagination";
import { XCircle } from "lucide-react";
import { EmptyState } from "./components/ReusableEmptyState";
import DeleteModuleDialog from "./CRUD/DeleteModuleDialog";
import { Id } from "../../../convex/_generated/dataModel";
import { UpdateModule } from "./CRUD/UpdateModule";

// Define the Module type (this reflects your schema)
export type Module = {
  _id: string;
  name: string;
  description?: string;
  isActiveByDefault: boolean;
  // For display purposes, we assume you resolve the permission names as strings
  permissions: string[];
};

type ModulesTableProps = {
  modules: Module[];
};

export function ModulesTable({ modules }: ModulesTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());

  // Simple name filter (you could expand this with more filters if needed)
  const filteredModules = React.useMemo(() => {
    // If you add additional filtering logic (e.g. date ranges), do it here.
    return modules;
  }, [modules]);

  const handleClearSelection = () => {
    setSelectedRows(new Set());
    table.getRowModel().rows.forEach((row) => row.toggleSelected(false));
  };

  const columns: ColumnDef<Module>[] = [
    {
      id: "select",
      size: 50,
      minSize: 50,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => {
            const isChecked = value === true;
            if (isChecked) {
              const newSelectedRows = new Set(modules.map((mod) => mod._id));
              setSelectedRows(newSelectedRows);
              table.getRowModel().rows.forEach((row) => row.toggleSelected(true));
            } else {
              handleClearSelection();
            }
          }}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => {
        const moduleId = row.original._id;
        return (
          <Checkbox
            checked={selectedRows.has(moduleId)}
            onCheckedChange={(value) => {
              const isChecked = value === true;
              const updatedSelectedRows = new Set(selectedRows);
              if (isChecked) {
                updatedSelectedRows.add(moduleId);
              } else {
                updatedSelectedRows.delete(moduleId);
              }
              setSelectedRows(updatedSelectedRows);
              row.toggleSelected(isChecked);
            }}
            aria-label={`Select ${row.original.name}`}
          />
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <span className="font-bold">{row.original.name}</span>,
    },
    {
      accessorKey: "description",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
      cell: ({ getValue }) => {
        const text = getValue<string>() || "N/A";
        const maxLength = 30;
        const truncatedText = text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
        return <span title={text}>{truncatedText}</span>;
      },
    },
    {
      accessorKey: "isActiveByDefault",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Active By Default" />,
      cell: ({ row }) =>
        row.original.isActiveByDefault ? (
          <Badge variant="secondary">Active</Badge>
        ) : (
          <Badge variant="outline">Inactive</Badge>
        ),
    },
    {
      accessorKey: "permissions",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Permissions" />,
      cell: ({ row }) => {
        const perms = row.original.permissions;
        const maxVisible = 2;
        const visiblePerms = perms.slice(0, maxVisible);
        const remainingPerms = perms.slice(maxVisible);

        return (
          <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap">
            {visiblePerms.map((perm, index) => (
              <Badge key={index} className="px-1 py-0.5 text-xs">
                {perm}
              </Badge>
            ))}
            {remainingPerms.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge className="px-1 py-0.5 text-xs">
                      +{remainingPerms.length} more
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>{remainingPerms.join(", ")}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const module = row.original;
        return (
          <div className="flex justify-end space-x-2">
            <UpdateModule moduleId={module._id as Id<"modules">} />
            <DeleteModuleDialog
              triggerText="Delete"
              title="Confirm Module Deletion"
              description={`Are you sure you want to delete the module "${module.name}"? This action cannot be undone.`}
              // Cast the module ID to the expected type.
              moduleId={module._id as Id<"modules">}
              moduleName={module.name}
              cancelText="Cancel"
              confirmText="Delete"
            />

          </div>
        );
      },
      size: 40,
    },
  ];

  const table = useReactTable({
    data: filteredModules,
    columns,
    state: { sorting, columnFilters, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      {/* Floating bar (if any selection is active) */}
      {selectedRows.size > 0 && (
        <StaticTasksTableFloatingBar table={table} setSelectedRows={setSelectedRows} />
      )}

      <div className="flex items-center justify-between py-4">
        {/* Search Input and Filters */}
        <div className="flex items-center space-x-4 flex-grow">
          <Input
            placeholder="Filter by module name..."
            value={(table.getColumn("name")?.getFilterValue() as string) || ""}
            onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
            className="w-full max-w-sm"
          />
          {/* Add any additional module-specific filters here */}
        </div>

        {/* Export and View Options */}
        <div className="flex items-center space-x-2">
          <ExportButton
            table={table}
            filename="modules"
            excludeColumns={["select", "actions"]}
          />
          <TableViewOptions
            columns={table
              .getAllColumns()
              .filter((column) => column.id !== "select" && column.id !== "actions")
              .map((column) => ({
                id: column.id,
                isVisible: column.getIsVisible(),
                toggleVisibility: () => column.toggleVisibility(!column.getIsVisible()),
                canHide: column.getCanHide(),
              }))}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="w-auto whitespace-nowrap overflow-hidden text-ellipsis"
                    style={getCommonPinningStyles({ column: header.column })}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-2 w-auto whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <div className="flex justify-center items-center text-center">
                    <EmptyState
                      title="No Modules Yet"
                      description="Create a new module to manage functionality."
                      imageSrc="/modules-empty.png"
                    /*  actionComponent={<AddModule />} */
                    />
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center py-4">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
