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
import { DataTableColumnHeader } from "@/components/ModulesManagement/datatable/DataTableColumnHeader";
import { getCommonPinningStyles } from "@/lib/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { StaticTasksTableFloatingBar } from "@/components/ModulesManagement/components/StaticTasksTableFloatingBar";
import { TableViewOptions } from "@/components/ModulesManagement/datatable/DataTableViewOptions";
import { ExportButton } from "@/components/ui/ExportButton";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTablePagination } from "@/components/ModulesManagement/datatable/DataTablePagination";
import { XCircle } from "lucide-react";
import { EmptyState } from "@/components/ModulesManagement/components/ReusableEmptyState";
import AddTeamDialog from "./AddTeamDialog";

// Define the Company and Role types
type Company = {
  _id: string;
  name: string;
};

type Role = {
  _id: string;
  name: string;
};

// Modify the User type to include company and role names
export type User = {
  _id: string;
  name?: string;
  email: string;
  companyId?: string;
  companyName?: string;
  roleId?: string;
  roleName?: string;
};

type UserTableProps = {
  users: User[];
};

export function UserTable({ users }: UserTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
  const [filteredUsers, setFilteredUsers] = React.useState<User[]>(users);

  const handleClearSelection = () => {
    setSelectedRows(new Set());
    table.getRowModel().rows.forEach((row) => row.toggleSelected(false));
  };

  const columns: ColumnDef<User>[] = [
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
              const newSelectedRows = new Set(users.map((user) => user._id));
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
        const userId = row.original._id;
        return (
          <Checkbox
            checked={selectedRows.has(userId)}
            onCheckedChange={(value) => {
              const isChecked = value === true;
              const updatedSelectedRows = new Set(selectedRows);
              if (isChecked) {
                updatedSelectedRows.add(userId);
              } else {
                updatedSelectedRows.delete(userId);
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
      cell: ({ row }) => <span className="font-bold">{row.original.name || "N/A"}</span>,
    },
    {
      accessorKey: "email",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      cell: ({ getValue }) => <span>{getValue<string>()}</span>,
    },
    {
      accessorKey: "companyName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />,
      cell: ({ getValue }) => <span>{getValue<string>() || "N/A"}</span>,
    },
    {
      accessorKey: "roleName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
      cell: ({ getValue }) => <span>{getValue<string>() || "N/A"}</span>,
    },
  ];

  const table = useReactTable({
    data: filteredUsers,
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
            placeholder="Filter by user name..."
            value={(table.getColumn("name")?.getFilterValue() as string) || ""}
            onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
            className="w-full max-w-sm"
          />
          {/* Add any additional user-specific filters here */}
        </div>

        {/* Export, View Options, and Add Team Button */}
        <div className="flex items-center space-x-2">
          <ExportButton
            table={table}
            filename="users"
            excludeColumns={["select"]}
          />
          <TableViewOptions
            columns={table
              .getAllColumns()
              .filter((column) => column.id !== "select")
              .map((column) => ({
                id: column.id,
                isVisible: column.getIsVisible(),
                toggleVisibility: () => column.toggleVisibility(!column.getIsVisible()),
                canHide: column.getCanHide(),
              }))}
          />
          <AddTeamDialog />
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
                      title="No Users Yet"
                      description="No users found in the system."
                      imageSrc="/users-empty.png"
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
