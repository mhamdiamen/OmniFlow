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
import { TableViewOptions } from "@/components/RoleManagement/datatable/DataTableViewOptions";
import { ExportButton } from "@/components/ui/ExportButton";
import { Calendar, Plus, XCircle } from "lucide-react";
import { DataTableFacetedFilter } from "@/components/RoleManagement/datatable/DataTableFacetedFilter";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DateRangePicker from "@/components/RoleManagement/components/DateRangePicker";
import { DataTablePagination } from "@/components/RoleManagement/datatable/DataTablePagination";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { EmptyState } from "@/components/RoleManagement/components/ReusableEmptyState";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import Link from "next/link";
import { formatDate } from "@/lib/dateUtils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Eye, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import DeleteTaskDialog from "./DeleteTaskDialog";
import { TasksTableFloatingBar } from "./TasksTableFloatingBar";
import { UpdateTaskDialog } from "./UpdateTaskDialog";
import { ViewTaskSheet } from "./ViewTaskSheet";

export type Task = {
    _id: string;
    name: string;
    description?: string;
    projectId: Id<"projects">;
    assigneeId?: Id<"users">;
    status: "todo" | "in_progress" | "completed" | "on_hold" | "canceled";
    priority: "low" | "medium" | "high" | "urgent";
    dueDate?: number;
    createdBy: Id<"users">;
    completedAt?: number;
    completedBy?: Id<"users">;
    assigneeDetails?: {
        _id: string;
        name?: string;
        email: string;
        image?: string;
    } | null;
    projectDetails?: {
        _id: string;
        name: string;
    } | null;
    creatorDetails?: {
        _id: string;
        name?: string;
        email: string;
        image?: string;
    } | null;
    completerDetails?: {
        _id: string;
        name?: string;
        email: string;
        image?: string;
    } | null;
};

type TasksTableProps = {
    tasks: Task[];
    projectId?: Id<"projects">;
};

export function TasksTable({ tasks, projectId }: TasksTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
    const [selectedStatus, setSelectedStatus] = React.useState<Set<string>>(new Set());
    const [selectedPriority, setSelectedPriority] = React.useState<Set<string>>(new Set());
    const [selectedAssignees, setSelectedAssignees] = React.useState<Set<string>>(new Set());
    const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    });
    // Add state for create task sheet
    const [createTaskOpen, setCreateTaskOpen] = React.useState(false);
    // Add state for the update dialog
    const [updateTaskOpen, setUpdateTaskOpen] = React.useState(false);
    const [selectedTaskForUpdate, setSelectedTaskForUpdate] = React.useState<Id<"tasks"> | null>(null);
    // Add state for view task sheet
    const [viewTaskOpen, setViewTaskOpen] = React.useState(false);
    const [selectedTaskForView, setSelectedTaskForView] = React.useState<Id<"tasks"> | null>(null);
    // Determine if any filters are applied
    const isFiltered = selectedStatus.size > 0 || selectedPriority.size > 0 || selectedAssignees.size > 0;

    // Extract unique statuses for filtering
    const uniqueStatuses = React.useMemo(() => {
        const statuses = Array.from(new Set(tasks.map(task => task.status)));
        return statuses.map((status) => ({
            value: status,
            label: status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1),
        }));
    }, [tasks]);

    // Extract unique priorities for filtering
    const uniquePriorities = React.useMemo(() => {
        const priorities = Array.from(new Set(tasks.map(task => task.priority)));
        return priorities.map((priority) => ({
            value: priority,
            label: priority.charAt(0).toUpperCase() + priority.slice(1),
        }));
    }, [tasks]);

    // Extract unique assignees for filtering
    const uniqueAssignees = React.useMemo(() => {
        const assignees = new Map<string, { value: string, label: string }>();

        tasks.forEach(task => {
            if (task.assigneeDetails && task.assigneeId) {
                const assigneeId = task.assigneeId as string;
                const name = task.assigneeDetails.name || task.assigneeDetails.email;
                assignees.set(assigneeId, {
                    value: assigneeId,
                    label: name,
                });
            }
        });

        return Array.from(assignees.values());
    }, [tasks]);

    // Filter tasks based on selected filters
    const filteredTasks = React.useMemo(() => {
        return tasks.filter((task) => {
            // Status filter
            if (selectedStatus.size > 0 && !selectedStatus.has(task.status)) {
                return false;
            }

            // Priority filter
            if (selectedPriority.size > 0 && !selectedPriority.has(task.priority)) {
                return false;
            }

            // Assignee filter
            if (selectedAssignees.size > 0 && (!task.assigneeId || !selectedAssignees.has(task.assigneeId as string))) {
                return false;
            }

            return true;
        });
    }, [tasks, selectedStatus, selectedPriority, selectedAssignees]);

    const resetFilters = () => {
        setSelectedStatus(new Set());
        setSelectedPriority(new Set());
        setSelectedAssignees(new Set());
    };
    // Function to handle view task
    const handleViewTask = (taskId: Id<"tasks">) => {
        setSelectedTaskForView(taskId);
        setViewTaskOpen(true);
    };
    // Function to clear selected rows
    const handleClearSelection = () => {
        setSelectedRows(new Set());
        table.getRowModel().rows.forEach((row) => row.toggleSelected(false));
    };

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTaskId, setDeleteTaskId] = useState<Id<"tasks"> | null>(null);
    const [deleteTaskName, setDeleteTaskName] = useState<string>("");

    // Function to handle edit button click
    const handleEditTask = (taskId: Id<"tasks">) => {
        setSelectedTaskForUpdate(taskId);
        setUpdateTaskOpen(true);
    };

    const columns: ColumnDef<Task>[] = [
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
                            const newSelectedRows = new Set(tasks.map((task) => task._id));
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
                const taskId = row.original._id;
                return (
                    <Checkbox
                        checked={selectedRows.has(taskId)}
                        onCheckedChange={(value) => {
                            const isChecked = value === true;
                            const updatedSelectedRows = new Set(selectedRows);
                            if (isChecked) {
                                updatedSelectedRows.add(taskId);
                            } else {
                                updatedSelectedRows.delete(taskId);
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
                <DataTableColumnHeader column={column} title="Task Name" />
            ),
            cell: ({ row }) => {
                const name = row.getValue("name") as string;
                return (
                    <div className="flex items-center space-x-2">
                        <span className="font-bold truncate max-w-[200px]" title={name}>
                            {name.length > 25 ? `${name.substring(0, 20)}...` : name}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Status" />
            ),
            cell: ({ row }) => {
                const status = row.getValue("status") as string;

                // Match status colors with the updated colors
                const statusColors: Record<string, string> = {
                    "todo": "bg-gray-500",
                    "in_progress": "bg-blue-500",
                    "completed": "bg-green-500",
                    "on_hold": "bg-yellow-500",
                    "canceled": "bg-red-500"
                };

                const statusLabels: Record<string, string> = {
                    "todo": "To Do",
                    "in_progress": "In Progress",
                    "completed": "Completed",
                    "on_hold": "On Hold",
                    "canceled": "Canceled"
                };

                return (
                    <Badge variant="outline" className="inline-flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${statusColors[status] || "bg-gray-500"} flex-shrink-0`}></div>
                        <span>{statusLabels[status] || status}</span>
                    </Badge>
                );
            },
        },
        {
            accessorKey: "priority",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Priority" />
            ),
            cell: ({ row }) => {
                const priority = row.getValue("priority") as string;

                // Match priority colors with the updated colors
                const priorityColors: Record<string, string> = {
                    "low": "bg-blue-400",
                    "medium": "bg-yellow-400",
                    "high": "bg-orange-400",
                    "urgent": "bg-red-500"
                };

                const priorityLabels: Record<string, string> = {
                    "low": "Low",
                    "medium": "Medium",
                    "high": "High",
                    "urgent": "Urgent"
                };

                return (
                    <Badge variant="outline" className="inline-flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${priorityColors[priority] || "bg-gray-400"} flex-shrink-0`}></div>
                        <span>{priorityLabels[priority] || priority}</span>
                    </Badge>
                );
            },
        },
        {
            accessorKey: "assigneeDetails",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Assignee" />
            ),
            cell: ({ row }) => {
                const assigneeDetails = row.original.assigneeDetails;

                return (
                    <div className="flex items-center space-x-2">
                        {assigneeDetails ? (
                            <>
                                <Avatar className="h-8 w-8 border-2">
                                    {assigneeDetails.image ? (
                                        <AvatarImage
                                            src={assigneeDetails.image}
                                            alt={assigneeDetails.name || assigneeDetails.email}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    ) : null}
                                    <AvatarFallback>
                                        {assigneeDetails.email?.[0]?.toUpperCase() || assigneeDetails.name?.[0]?.toUpperCase() || '?'}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex flex-col">
                                    <span className="font-bold">{assigneeDetails.name || assigneeDetails.email}</span>
                                    {assigneeDetails.name && (
                                        <span className="text-xs text-muted-foreground block">
                                            {assigneeDetails.email}
                                        </span>
                                    )}
                                </div>
                            </>
                        ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "projectDetails",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Project" />
            ),
            cell: ({ row }) => {
                const projectDetails = row.original.projectDetails;

                return projectDetails ? (
                    <Link href={`/modules/projects/${projectDetails._id}`} className="font-bold hover:underline">
                        {projectDetails.name}
                    </Link>
                ) : (
                    <span className="text-muted-foreground">-</span>
                );
            },
        },
        {
            accessorKey: "dueDate",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Due Date" />
            ),
            cell: ({ row }) => {
                const date = row.original.dueDate;

                // Calculate if task is overdue
                const isOverdue = date && date < Date.now() && row.original.status !== "completed";

                return (
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {date ? (
                            <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                                {formatDate(date)}
                                {isOverdue && " (Overdue)"}
                            </span>
                        ) : (
                            <span className="text-muted-foreground">Not set</span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "completedAt",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Completed" />
            ),
            cell: ({ row }) => {
                const date = row.original.completedAt;
                const completer = row.original.completerDetails;

                return date ? (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(date)}
                        </div>
                        {completer && (
                            <span className="text-xs text-muted-foreground mt-1">
                                by {completer.name || completer.email}
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-muted-foreground">-</span>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const task = row.original as Task;
                return (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleViewTask(task._id as Id<"tasks">);
                                    }}
                                >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleEditTask(task._id as Id<"tasks">);
                                    }}
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Task
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => {
                                        setDeleteTaskId(task._id as Id<"tasks">);
                                        setDeleteTaskName(task.name);
                                        setDeleteDialogOpen(true);
                                    }}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Task
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Delete Task Dialog */}
                        {deleteTaskId === task._id && (
                            <DeleteTaskDialog
                                triggerText="Delete"
                                title="Delete Task"
                                description={
                                    <>
                                        Are you sure you want to delete the task <strong>{deleteTaskName}</strong>?
                                        <br />
                                        This action cannot be undone.
                                    </>
                                }
                                taskId={deleteTaskId}
                                taskName={deleteTaskName}
                                open={deleteDialogOpen}
                                onOpenChange={setDeleteDialogOpen}
                            />
                        )}
                    </div>
                );
            },
            size: 40,
        },
    ];

    const table = useReactTable({
        data: filteredTasks,
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
            {selectedRows.size > 0 && (
                <TasksTableFloatingBar
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

                    {/* Priority Filter Dropdown */}
                    <DataTableFacetedFilter
                        title="Priority"
                        options={uniquePriorities}
                        selectedValues={selectedPriority}
                        onChange={setSelectedPriority}
                        renderOption={(option) => (
                            <div className="flex items-center space-x-2">
                                <span>{option.label}</span>
                            </div>
                        )}
                    />

                    {/* Assignee Filter Dropdown */}
                    {uniqueAssignees.length > 0 && (
                        <DataTableFacetedFilter
                            title="Assignee"
                            options={uniqueAssignees}
                            selectedValues={selectedAssignees}
                            onChange={setSelectedAssignees}
                            renderOption={(option) => (
                                <div className="flex items-center space-x-2">
                                    <span>{option.label}</span>
                                </div>
                            )}
                        />
                    )}

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
                        filename="tasks"
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
                                            title="No Tasks Yet"
                                            description="Start managing your tasks by creating a new one today!"
                                            imageSrc="/task-empty.png"

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

            {/* Add the UpdateTaskDialog */}
            {selectedTaskForUpdate && (
                <UpdateTaskDialog
                    taskId={selectedTaskForUpdate}
                    open={updateTaskOpen}
                    onOpenChange={(open) => {
                        setUpdateTaskOpen(open);
                        if (!open) setSelectedTaskForUpdate(null);
                    }}
                />
            )}

            <ViewTaskSheet
                taskId={selectedTaskForView}
                open={viewTaskOpen}
                onOpenChange={setViewTaskOpen}
            />
        </div>
    );
}
