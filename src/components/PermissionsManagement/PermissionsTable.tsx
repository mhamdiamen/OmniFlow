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
import { format } from "date-fns";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { DataTablePagination } from "./datatable/DataTablePagination";
import DeletePermissionDialog from "./CRUD/DeletePermissionDialog";
import { Id } from "../../../convex/_generated/dataModel";
import { EmptyState } from "./components/ReusableEmptyState";
import { AddPermission } from "./CRUD/AddPermission";
import { XCircle } from "lucide-react";
import DateRangePicker from "./components/DateRangePicker";

export type Permission = {
    _id: string;
    name: string;
    description?: string;
    assignedRoles: string[];
    createdAt: string;
};

type PermissionsTableProps = {
    permissions: Permission[];
};

export function PermissionsTable({ permissions }: PermissionsTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
    const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    });

    const handleClearSelection = () => {
        setSelectedRows(new Set());
        table.getRowModel().rows.forEach((row) => row.toggleSelected(false));
    };

    const columns: ColumnDef<Permission>[] = [
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
                            const newSelectedRows = new Set(permissions.map((perm) => perm._id));
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
                const permissionId = row.original._id;
                return (
                    <Checkbox
                        checked={selectedRows.has(permissionId)}
                        onCheckedChange={(value) => {
                            const isChecked = value === true;
                            const updatedSelectedRows = new Set(selectedRows);
                            if (isChecked) {
                                updatedSelectedRows.add(permissionId);
                            } else {
                                updatedSelectedRows.delete(permissionId);
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
            accessorKey: "assignedRoles",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Assigned Roles" />,
            cell: ({ row }) => {
                const roles = row.original.assignedRoles;
                const maxVisibleRoles = 2;
                const visibleRoles = roles.slice(0, maxVisibleRoles);
                const remainingRoles = roles.slice(maxVisibleRoles);
                return (
                    <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap">
                        {visibleRoles.map((role, index) => (
                            <Badge key={index} className="px-1 py-0.5 text-xs">
                                {role}
                            </Badge>
                        ))}
                        {remainingRoles.length > 0 && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Badge className="px-1 py-0.5 text-xs bg-gray-200">
                                            +{remainingRoles.length} more
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <span>{remainingRoles.join(", ")}</span>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
            cell: ({ row }) => format(new Date(row.original.createdAt), "MMM dd, yyyy, h:mm a"),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const permission = row.original;
                return (
                    <div className="flex justify-end">
                        <DeletePermissionDialog
                            triggerText="Delete"
                            title="Confirm Permission Deletion"
                            description={`Are you sure you want to delete the permission "${permission.name}"? This action cannot be undone.`}
                            permissionId={permission._id as Id<"permissions">}
                            permissionName={permission.name}
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
        data: permissions,
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
            {/* Floating bar */}
            {selectedRows.size > 0 && (
                <StaticTasksTableFloatingBar
                    table={table}
                    setSelectedRows={setSelectedRows}
                />
            )}

            <div className="flex items-center justify-between py-4">
                {/* Search Input, Filters, and Date Range Picker */}
                <div className="flex items-center space-x-4 flex-grow">
                    {/* Name Filter */}
                    <Input
                        placeholder="Filter by name..."
                        value={(table.getColumn("name")?.getFilterValue() as string) || ""}
                        onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
                        className="w-full max-w-sm"
                    />

                    {/* Reset Filters Button */}
                    {table.getState().columnFilters.length > 0 && (
                        <Button
                            aria-label="Reset filters"
                            variant="ghost"
                            className="h-8 px-2 lg:px-3"
                            onClick={() => table.resetColumnFilters()}
                        >
                            Reset
                            <XCircle className="ml-2 size-4" aria-hidden="true" />
                        </Button>
                    )}
                </div>

                {/* Export and View Buttons */}
                <div className="flex items-center space-x-2">
                    {/* Date Range Picker */}
                    <DateRangePicker
                        dateRange={dateRange}
                        placeholder="Select Date Range"
                        triggerVariant="outline"
                        triggerSize="sm"
                        onDateRangeChange={setDateRange}
                    />

                    <ExportButton
                        table={table}
                        filename="permissions"
                        excludeColumns={["select", "actions"]}
                    />
                    <TableViewOptions
                        columns={table
                            .getAllColumns()
                            .filter((column) => column.id !== "select" && column.id !== "actions")
                            .map((column) => ({
                                id: column.id,
                                isVisible: column.getIsVisible(),
                                toggleVisibility: () =>
                                    column.toggleVisibility(!column.getIsVisible()),
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
                                    <TableHead key={header.id} className="w-auto whitespace-nowrap overflow-hidden text-ellipsis" style={{
                                        ...getCommonPinningStyles({ column: header.column }),
                                    }}>
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
                                        <TableCell key={cell.id} className="py-2 w-auto whitespace-nowrap overflow-hidden text-ellipsis">
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
                                            title="No Permissions Yet"
                                            description="Create a new permission to manage access."
                                            imageSrc="/permissions-empty.png"
                                            actionComponent={<AddPermission />}
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