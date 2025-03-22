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
import { DataTableColumnHeader } from "@/components/RoleManagement/datatable/DataTableColumnHeader";
import { getCommonPinningStyles } from "@/lib/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { StaticTasksTableFloatingBar } from "@/components/RoleManagement/components/StaticTasksTableFloatingBar";
import { TableViewOptions } from "@/components/RoleManagement/datatable/DataTableViewOptions";
import { ExportButton } from "@/components/ui/ExportButton";
import { Plus, XCircle } from "lucide-react";
import { DataTableFacetedFilter } from "@/components/RoleManagement/datatable/DataTableFacetedFilter";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DateRangePicker from "@/components/RoleManagement/components/DateRangePicker";
import { DataTablePagination } from "@/components/RoleManagement/datatable/DataTablePagination";
import { Id } from "../../../../../convex/_generated/dataModel";
import { EmptyState } from "@/components/RoleManagement/components/ReusableEmptyState";
import { CreateProject } from "./CreateProject";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";

export type Project = {
    _id: string;
    name: string;
    description?: string;
    companyId: string;
    teamId?: string;
    projectId?: string;
    status: "planned" | "in_progress" | "completed" | "on_hold" | "canceled";
    startDate: number;
    endDate?: number;
    createdBy: string;
    updatedBy?: string;
    updatedAt?: number;
};

type ProjectsTableProps = {
    projects: Project[];
};

// Remove the CreateProject import
// import { CreateProject } from "./CreateProject";

export function ProjectsTable({ projects }: ProjectsTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
    const [selectedStatus, setSelectedStatus] = React.useState<Set<string>>(new Set());
    const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    });

    // Determine if any filters are applied
    const isFiltered = selectedStatus.size > 0;
    
    // Extract unique statuses for filtering
    const uniqueStatuses = React.useMemo(() => {
        const statuses = Array.from(new Set(projects.map(project => project.status)));
        return statuses.map((status) => ({
            value: status,
            label: status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1),
        }));
    }, [projects]);
    
    // Filter projects based on selected status
    const filteredProjects = React.useMemo(() => {
        return projects.filter((project) => {
            // If no status is selected, include all projects
            if (selectedStatus.size === 0) return true;

            // Check if the project status is in the selected statuses
            return selectedStatus.has(project.status);
        });
    }, [projects, selectedStatus]);

    const resetFilters = () => {
        setSelectedStatus(new Set());
    };

    // Function to clear selected rows
    const handleClearSelection = () => {
        setSelectedRows(new Set());
        table.getRowModel().rows.forEach((row) => row.toggleSelected(false));
    };
    
    // Fetch user details for creators and updaters
    const userIds = React.useMemo(() => {
        const ids = new Set<string>();
        projects.forEach(project => {
            if (project.createdBy) ids.add(project.createdBy);
            if (project.updatedBy) ids.add(project.updatedBy);
        });
        return Array.from(ids);
    }, [projects]);
    
    const users = useQuery(api.queries.users.getUsersByIds, {
        userIds: userIds as Id<"users">[]
    }) || [];
    
    // Create a map of user IDs to user names
    const userMap = new Map(users.map(user => [user._id, user.name || user.email]));
    
    const columns: ColumnDef<Project>[] = [
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
                            const newSelectedRows = new Set(projects.map((project) => project._id));
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
                const projectId = row.original._id;
                return (
                    <Checkbox
                        checked={selectedRows.has(projectId)}
                        onCheckedChange={(value) => {
                            const isChecked = value === true;
                            const updatedSelectedRows = new Set(selectedRows);
                            if (isChecked) {
                                updatedSelectedRows.add(projectId);
                            } else {
                                updatedSelectedRows.delete(projectId);
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
            accessorKey: "status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Status" />
            ),
            cell: ({ row }) => {
                const status = row.original.status;
                const statusColors: Record<string, string> = {
                    planned: "bg-blue-100 text-blue-800",
                    in_progress: "bg-yellow-100 text-yellow-800",
                    completed: "bg-green-100 text-green-800",
                    on_hold: "bg-gray-100 text-gray-800",
                    canceled: "bg-red-100 text-red-800",
                };
                
                const displayStatus = status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1);
                
                return (
                    <Badge className={`${statusColors[status]} px-2 py-1`}>
                        {displayStatus}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "startDate",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Start Date" />
            ),
            cell: ({ row }) => {
                const date = row.original.startDate;
                return format(new Date(date), "MMM dd, yyyy");
            },
        },
        {
            accessorKey: "endDate",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="End Date" />
            ),
            cell: ({ row }) => {
                const date = row.original.endDate;
                return date ? format(new Date(date), "MMM dd, yyyy") : "Not set";
            },
        },
        {
            accessorKey: "createdBy",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Created By" />
            ),
            cell: ({ row }) => {
                const createdById = row.original.createdBy;
                return <span>{userMap.get(createdById as Id<"users">) || "Unknown User"}</span>;
            },
        },
        {
            accessorKey: "updatedBy",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Updated By" />
            ),
            cell: ({ row }) => {
                const updatedById = row.original.updatedBy;
                return updatedById ? <span>{userMap.get(updatedById as Id<"users">) || "Unknown User"}</span> : <span>-</span>;
            },
        },
        {
            accessorKey: "updatedAt",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Last Updated" />
            ),
            cell: ({ row }) => {
                const date = row.original.updatedAt;
                return date ? format(new Date(date), "MMM dd, yyyy HH:mm") : <span>-</span>;
            },
        },
        {
            accessorKey: "teamId",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Team" />
            ),
            cell: ({ row }) => {
                // This would ideally fetch team names, but for now we'll just show the ID
                const teamId = row.original.teamId;
                return teamId ? <span className="text-xs text-muted-foreground">{teamId}</span> : <span>-</span>;
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const project = row.original as Project;
                return (
                    <div className="flex justify-end">
                       {/*  <UpdateProject projectId={project._id as Id<"projects">} />
                        <DeleteProject
                            projectId={project._id as Id<"projects">}
                            projectName={project.name}
                        /> */}
                    </div>
                );
            },
            size: 40,
        },
    ];
    
    const table = useReactTable({
        data: filteredProjects,
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
                    <Input
                        placeholder="Filter by name..."
                        value={(table.getColumn("name")?.getFilterValue() as string) || ""}
                        onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
                        className="w-full max-w-sm"
                    />

                    {/* Status Filter Dropdown */}
                    <DataTableFacetedFilter
                        title="Status"
                        options={uniqueStatuses}
                        selectedValues={selectedStatus}
                        renderOption={(option) => (
                            <div className="flex items-center space-x-2">
                                <span>{option.label}</span>
                            </div>
                        )}
                        onChange={setSelectedStatus}
                    />

                    {/* Reset Filters Button */}
                    {isFiltered && (
                        <Button
                            aria-label="Reset filters"
                            variant="ghost"
                            className="h-8 px-2 lg:px-3"
                            onClick={resetFilters}
                        >
                            Reset
                            <XCircle className="ml-2 size-4" aria-hidden="true" />
                        </Button>
                    )}
                </div>

                {/* Export and View Buttons */}
                <div className="flex items-center space-x-2">
                    {/* Add Create Project Link Button */}
                    <Link href="/modules/projects/create" passHref>
                        <Button size="sm" className="cursor-pointer">
                            <Plus className="mr-2 h-4 w-4" /> Add Project
                        </Button>
                    </Link>
                    
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
                        filename="projects"
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
                                <TableCell
                                    colSpan={columns.length}
                                >
                                    <div
                                        className="flex justify-center items-center text-center "
                                    >
                                        <EmptyState
                                            title="No Projects Yet"
                                            description="Start managing your projects by creating a new one today!"
                                            imageSrc="/project-empty.png"
                                            actionComponent={
                                                <Link href="/modules/projects/create" passHref>
                                                    <Button size="sm" className="cursor-pointer">
                                                        <Plus className="mr-2 h-4 w-4" /> Add Project
                                                    </Button>
                                                </Link>
                                            }
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