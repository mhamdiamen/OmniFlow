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
import { getCommonPinningStyles } from "@/lib/data-table"
import { Checkbox } from "../ui/checkbox";
import { StaticTasksTableFloatingBar } from "./components/StaticTasksTableFloatingBar";
import { TableViewOptions } from "./datatable/DataTableViewOptions";
import { ExportButton } from "../ui/ExportButton";
import { Bell, CheckCircle, Circle, CircleCheck, CircleCheckBig, CircleX, Clock, Ellipsis, FileText, Heart, Home, Loader, Settings, Star, Lock, Unlock, User, XCircle, EditIcon, Tags, TrashIcon } from "lucide-react";
import { DataTableFacetedFilter } from "./datatable/DataTableFacetedFilter";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import Image from "next/image";
import rogue from "../../../public/img/rogue.png";
import pilot from "../../../public/img/pilot.png";
import kiddo from "../../../public/img/kiddo.png";
import astro from "../../../public/img/astro.png";
import DateRangePicker from "./components/DateRangePicker";
import { DataTablePagination } from "./datatable/DataTablePagination";
import DeleteStoryDialog from "./CRUD/DeleteStoryDialog";
import { Id } from "../../../convex/_generated/dataModel";
import BulkDeleteDialog from "./CRUD/BulkDeleteDialog";
import { UpdateStory } from "./CRUD/UpdateStory";
import { EmptyState } from "./components/ReusableEmptyState";
import DeleteRoleDialog from "./CRUD/DeleteStoryDialog";
import { AddRole } from "./CRUD/AddRole";

export type Role = {
    _id: string;
    name: string;
    description?: string;
    permissions: string[];
    companyId?: string;
    createdAt: string;
};

type RolesTableProps = {
    roles: Role[];
};

export function RolesTable({ roles }: RolesTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
    const [selectedStatus, setSelectedStatus] = React.useState<Set<string>>(new Set()); // New state for selected status
    const [selectedPrivacy, setSelectedPrivacy] = React.useState<Set<string>>(new Set()); // Change to Set<string>
    const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    });

    // Determine if any filters are applied
    const isFiltered = selectedStatus.size > 0 || selectedPrivacy.size > 0;

    // Filter stories based on selected status and privacy
    const filteredRoles = React.useMemo(() => {
        return roles.filter(role => {
            // Add any filtering logic here if needed
            return true;
        });
    }, [roles]);


    const resetFilters = () => {
        setSelectedStatus(new Set());
        setSelectedPrivacy(new Set());
    };

    // Map of status to icons
    const statusIcons = {
        Ongoing: Clock,
        Completed: CircleCheckBig,
        Abandoned: CircleX,
    };
    // Dynamically generate options for privacy filter



    // Dynamically generate options from story statuses
    // Function to clear selected rows
    const handleClearSelection = () => {
        setSelectedRows(new Set());
        table.getRowModel().rows.forEach((row) => row.toggleSelected(false));
    };
    const columns: ColumnDef<Role>[] = [
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
                            const newSelectedRows = new Set(roles.map((role) => role._id));
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
                const roleId = row.original._id;
                return (
                    <Checkbox
                        checked={selectedRows.has(roleId)}
                        onCheckedChange={(value) => {
                            const isChecked = value === true;
                            const updatedSelectedRows = new Set(selectedRows);
                            if (isChecked) {
                                updatedSelectedRows.add(roleId);
                            } else {
                                updatedSelectedRows.delete(roleId);
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
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
            cell: ({ row }) => (
                <span className="font-bold">{row.original.name}</span>
            ),
        },
        {
            accessorKey: "description",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Description" />
            ),
            cell: ({ getValue }) => {
                const text = getValue<string>() || "N/A"; // Default to "N/A" if undefined
                const maxLength = 30;
                const truncatedText = text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
                return <span title={text}>{truncatedText}</span>;
            },
        },
        {
            accessorKey: "permissions",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Permissions" />
            ),
            cell: ({ row }) => {
                const permissions = row.original.permissions;
                const maxVisiblePermissions = 2;
                const visiblePermissions = permissions.slice(0, maxVisiblePermissions);
                const remainingPermissions = permissions.slice(maxVisiblePermissions);

                return (
                    <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap">
                        {visiblePermissions.map((permission, index) => (
                            <Badge key={index} className="px-1 py-0.5 text-xs">
                                {permission}
                            </Badge>
                        ))}
                        {remainingPermissions.length > 0 && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Badge className="px-1 py-0.5 text-xs bg-gray-200">
                                            +{remainingPermissions.length} more
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <span>{remainingPermissions.join(", ")}</span>
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
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Created At" />
            ),
            cell: ({ row }) => {
                const date = row.original.createdAt;
                return format(new Date(date), "MMM dd, yyyy, h:mm a");
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const role = row.original as Role;
                return (
                    <div className="flex justify-end">
                        {/* <UpdateRole roleId={role._id as Id<"roles">} /> */}
                        <DeleteRoleDialog
                            triggerText="Delete"
                            title="Confirm Role Deletion"
                            description={`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`}
                            roleId={role._id as Id<"roles">}
                            roleName={role.name}
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
        data: filteredRoles,
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

                    {/* Title Filter */}
                    {/*   <Input
                        placeholder="Filter by title..."
                        value={(table.getColumn("title")?.getFilterValue() as string) || ""}
                        onChange={(e) => table.getColumn("title")?.setFilterValue(e.target.value)}
                        className="w-full max-w-sm"
                    /> */}

                    {/* Status Filter Dropdown */}
                    {/*    <DataTableFacetedFilter
                        title="Status"
                        options={dynamicOptions}
                        selectedValues={selectedStatus} // Pass selected values
                        renderOption={(option) => (
                            <div className="flex items-center space-x-2">
                                {option.icon && <option.icon className="w-4 h-4" />}
                                <span>{option.label}</span>
                                <span className="text-gray-500">({option.count})</span>
                            </div>
                        )}
                        onChange={setSelectedStatus}
                    /> */}

                    {/* Privacy Filter Dropdown */}
                    {/*   <DataTableFacetedFilter
                        title="Privacy"
                        options={privacyOptions}
                        selectedValues={selectedPrivacy} // Pass selected values
                        renderOption={(option) => (
                            <div className="flex items-center space-x-2">
                                <span>{option.label}</span>
                                <span className="text-gray-500">({option.count})</span>
                            </div>
                        )}
                        onChange={setSelectedPrivacy}
                    />
 */}
                    {/* Reset Filters Button */}
                    {isFiltered && (
                        <Button
                            aria-label="Reset filters"
                            variant="ghost"
                            className="h-8 px-2 lg:px-3"
                            onClick={resetFilters} // Call resetFilters function
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
                        onDateRangeChange={setDateRange} // Update the date range
                    />

                    <ExportButton
                        table={table}
                        filename="stories"
                        excludeColumns={["select", "actions"]}
                    />
                    <TableViewOptions
                        columns={table
                            .getAllColumns()
                            .filter((column) => column.id !== "select" && column.id !== "actions") // Exclude "select" and "actions" columns
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
                                <TableCell
                                    colSpan={columns.length}
                                >
                                    <div
                                        className="flex justify-center items-center text-center "
                                    >
                                        <EmptyState
                                            title="No Stories Yet"
                                            description="Begin your creative journey by adding a new story today!"
                                            imageSrc="/stories-empty-2.png"
                                            actionComponent={<AddRole />}
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
