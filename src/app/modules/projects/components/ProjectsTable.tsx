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
import { Calendar, Plus, XCircle } from "lucide-react";
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
import { formatDate } from "@/lib/dateUtils";
import DeleteProjectDialog from "./DeleteProjectDialog";
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
import { ProjectsTableFloatingBar } from "./ProjectsTableFloatingBar";
import { CreateTaskSheet } from "../tasks/components/CreateTaskSheet";
import { Progress } from "@/components/ui/progress";
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
    teamDetails?: {
        _id: string;
        name: string;
    } | null;
    creatorDetails?: {
        _id: string;
        name: string;
        email: string;
        image?: string;
    } | null;
    // Add the missing fields from schema.ts
    tags?: string[];
    category?: string;
    healthStatus?: "on_track" | "at_risk" | "off_track";
    priority?: "low" | "medium" | "high" | "critical";
    progress?: number;
    completedTasks?: number;
    totalTasks?: number;
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
    const [selectedCategories, setSelectedCategories] = React.useState<Set<string>>(new Set());
    const [selectedTags, setSelectedTags] = React.useState<Set<string>>(new Set());
    const [selectedHealthStatus, setSelectedHealthStatus] = React.useState<Set<string>>(new Set());
    const [selectedPriorities, setSelectedPriorities] = React.useState<Set<string>>(new Set());
    const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    });
    // Add state for task creation
    const [createTaskOpen, setCreateTaskOpen] = useState(false);
    const [selectedProjectForTask, setSelectedProjectForTask] = useState<Id<"projects"> | null>(null);

    // Determine if any filters are applied
    const isFiltered = selectedStatus.size > 0 || selectedCategories.size > 0 || selectedTags.size > 0 ||
        selectedHealthStatus.size > 0 || selectedPriorities.size > 0;

    // Extract unique statuses for filtering
    const uniqueStatuses = React.useMemo(() => {
        const statuses = Array.from(new Set(projects.map(project => project.status)));
        return statuses.map((status) => ({
            value: status,
            label: status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1),
        }));
    }, [projects]);

    // Extract unique categories for filtering
    const uniqueCategories = React.useMemo(() => {
        const categories = Array.from(new Set(projects.map(project => project.category).filter(Boolean)));
        return categories.map((category) => ({
            value: category,
            label: category,
        }));
    }, [projects]);
    // Extract unique health statuses for filtering
    const uniqueHealthStatuses = React.useMemo(() => {
        const healthStatuses = Array.from(new Set(projects.map(project => project.healthStatus).filter(Boolean)));
        return healthStatuses.map((status) => ({
            value: status,
            label: status ? status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1) : 'Unknown',
        }));
    }, [projects]);
    // Extract unique priorities for filtering
    const uniquePriorities = React.useMemo(() => {
        const priorities = Array.from(new Set(projects.map(project => project.priority).filter(Boolean)));
        return priorities.map((priority) => ({
            value: priority,
            label: priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Unknown',
        }));
    }, [projects]);
    // Extract unique tags for filtering
    const uniqueTags = React.useMemo(() => {
        const allTags = new Set<string>();
        projects.forEach(project => {
            if (Array.isArray(project.tags)) {
                project.tags.forEach(tag => allTags.add(tag));
            }
        });
        return Array.from(allTags).map(tag => ({
            value: tag,
            label: tag,
        }));
    }, [projects]);

    // Filter projects based on selected filters
    const filteredProjects = React.useMemo(() => {
        return projects.filter((project) => {
            // Status filter
            if (selectedStatus.size > 0 && !selectedStatus.has(project.status)) {
                return false;
            }

            // Category filter
            if (selectedCategories.size > 0 && (!project.category || !selectedCategories.has(project.category))) {
                return false;
            }

            // Health Status filter
            if (selectedHealthStatus.size > 0 && (!project.healthStatus || !selectedHealthStatus.has(project.healthStatus))) {
                return false;
            }

            // Priority filter
            if (selectedPriorities.size > 0 && (!project.priority || !selectedPriorities.has(project.priority))) {
                return false;
            }

            // Tags filter
            if (selectedTags.size > 0) {
                if (!Array.isArray(project.tags) || project.tags.length === 0) {
                    return false;
                }

                // Check if any of the project's tags are in the selected tags
                const hasSelectedTag = project.tags.some(tag => selectedTags.has(tag));
                if (!hasSelectedTag) {
                    return false;
                }
            }

            return true;
        });
    }, [projects, selectedStatus, selectedCategories, selectedTags, selectedHealthStatus, selectedPriorities]);

    const resetFilters = () => {
        setSelectedStatus(new Set());
        setSelectedCategories(new Set());
        setSelectedTags(new Set());
        setSelectedHealthStatus(new Set());
        setSelectedPriorities(new Set());
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
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteProjectId, setDeleteProjectId] = useState<Id<"projects"> | null>(null);
    const [deleteProjectName, setDeleteProjectName] = useState<string>("");

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
                <DataTableColumnHeader column={column} title="Project Name" />
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
        /* {
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
        }, */
      
        {
            accessorKey: "teamId",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Team" />
            ),
            cell: ({ row }) => {
                // Use the teamDetails that are returned from the API
                const project = row.original as any; // Using any to access the teamDetails property
                const teamDetails = project.teamDetails;

                return teamDetails ? (
                    <span className="font-bold">{teamDetails.name}</span>
                ) : (
                    <span className="text-muted-foreground">-</span>
                );
            },
        },
       
        {
            accessorKey: "category",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Category" />
            ),
            cell: ({ row }) => {
                const category = row.getValue("category") as string;
                return category ? (
                    <Badge variant="secondary" className="px-2 py-1">
                        {category}
                    </Badge>
                ) : (
                    <span className="text-muted-foreground text-sm">No category</span>
                );
            },
        },

        {
            accessorKey: "tags",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Tags" />
            ),
            cell: ({ row }) => {
                const tags = row.getValue("tags") as string[];
                const maxVisibleTags = 1;

                if (!tags || tags.length === 0) {
                    return <span className="text-muted-foreground text-sm">No tags</span>;
                }

                const visibleTags = tags.slice(0, maxVisibleTags);
                const remainingTags = tags.slice(maxVisibleTags);

                return (
                    <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap">
                        {visibleTags.map((tag, index) => (
                            <Badge key={index} className="px-1 py-0.5 text-xs">
                                {tag}
                            </Badge>
                        ))}
                        {remainingTags.length > 0 && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Badge className="px-1 py-0.5 text-xs">
                                            +{remainingTags.length} more
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <span>{remainingTags.join(", ")}</span>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                );
            },
        }, 
        {
            accessorKey: "createdBy",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Created By" />
            ),
            cell: ({ row }) => {
                const project = row.original;
                const creatorDetails = project.creatorDetails;

                return (
                    <div className="flex items-center space-x-2">
                        {creatorDetails ? (
                            <>
                                <Avatar className="h-8 w-8 border-2">
                                    {creatorDetails.image ? (
                                        <AvatarImage
                                            src={creatorDetails.image}
                                            alt={creatorDetails.name}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    ) : null}
                                    <AvatarFallback>
                                        {creatorDetails.email?.[0]?.toUpperCase() || creatorDetails.name?.[0]?.toUpperCase() || '?'}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex flex-col">
                                    <span className="font-bold">{creatorDetails.name}</span>
                                    <span className="text-xs text-muted-foreground block">
                                        {creatorDetails.email || 'Email not available'}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <span className="text-muted-foreground">Unknown User</span>
                        )}
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
                // Match status colors with create project page
                const statusColors: Record<string, string> = {
                    "planned": "bg-blue-500",
                    "in_progress": "bg-green-500",
                    "completed": "bg-purple-500",
                    "on_hold": "bg-amber-500",
                    "canceled": "bg-red-500"
                };

                const statusLabels: Record<string, string> = {
                    "planned": "Planned",
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
            accessorKey: "healthStatus",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Health " />
            ),
            cell: ({ row }) => {
                const healthStatus = row.getValue("healthStatus") as string;

                // Match health status colors
                const healthStatusColors: Record<string, string> = {
                    "on_track": "bg-green-500",
                    "at_risk": "bg-amber-500",
                    "off_track": "bg-red-500"
                };

                const healthStatusLabels: Record<string, string> = {
                    "on_track": "On Track",
                    "at_risk": "At Risk",
                    "off_track": "Off Track"
                };

                return healthStatus ? (
                    <Badge variant="outline" className="inline-flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${healthStatusColors[healthStatus] || "bg-gray-500"} flex-shrink-0`}></div>
                        <span>{healthStatusLabels[healthStatus] || healthStatus}</span>
                    </Badge>
                ) : (
                    <span className="text-muted-foreground text-sm">Not set</span>
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

                // Match priority colors
                const priorityColors: Record<string, string> = {
                    "low": "bg-blue-500",
                    "medium": "bg-yellow-500",
                    "high": "bg-orange-500",
                    "critical": "bg-red-500"
                };

                const priorityLabels: Record<string, string> = {
                    "low": "Low",
                    "medium": "Medium",
                    "high": "High",
                    "critical": "Critical"
                };

                return priority ? (
                    <Badge variant="outline" className="inline-flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${priorityColors[priority] || "bg-gray-500"} flex-shrink-0`}></div>
                        <span>{priorityLabels[priority] || priority}</span>
                    </Badge>
                ) : (
                    <span className="text-muted-foreground text-sm">Not set</span>
                );
            },
        },
        {
            accessorKey: "progress",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Progress" />
            ),
            cell: ({ row }) => {
                const project = row.original;
                const progress = project.progress || 0;
        
                // Determine progress bar color based on percentage
                const getProgressColor = (progress: number) => {
                    if (progress < 30) return 'bg-red-500';      // 0-29% - Red
                    if (progress < 70) return 'bg-yellow-500';   // 30-69% - Yellow
                    if (progress < 90) return 'bg-blue-500';     // 70-89% - Blue
                    return 'bg-green-500';                       // 90-100% - Green
                };
        
                const progressClass = getProgressColor(progress);
        
                return (
                    <div className="w-[150px] flex items-center gap-2">
                        {/* Thinner Progress Bar (no border) */}
                        <div className="relative w-full h-2 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700">
                            <div
                                className={`h-full ${progressClass} transition-all duration-300`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
        
                        {/* Percentage Text - Right-aligned, smaller font */}
                        <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {progress}%
                        </span>
                    </div>
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
                return (
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(date)}
                    </div>
                );
            },
        },
        {
            accessorKey: "endDate",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="End Date" />
            ),
            cell: ({ row }) => {
                const date = row.original.endDate;
                return (
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {date ? formatDate(date) : "Not set"}
                    </div>
                );
            },
        },

         

       /*  {
            accessorKey: "updatedAt",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Last Updated" />
            ),
            cell: ({ row }) => {
                const date = row.original.updatedAt;
                return (
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {date ? formatDate(date) : <span>-</span>}
                    </div>
                );
            },
        }, */
        // Modify the actions column to include the "Add Task" option
        {
            id: "actions",
            cell: ({ row }) => {
                const project = row.original as Project;
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
                                <DropdownMenuItem asChild>
                                    <Link href={`/modules/projects/${project._id}`} className="flex items-center cursor-pointer">
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={`/modules/projects/edit/${project._id}`} className="flex items-center cursor-pointer">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Project
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => {
                                        setSelectedProjectForTask(project._id as Id<"projects">);
                                        setCreateTaskOpen(true);
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Task
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => {
                                        setDeleteProjectId(project._id as Id<"projects">);
                                        setDeleteProjectName(project.name);
                                        setDeleteDialogOpen(true);
                                    }}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Project
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Delete Project Dialog */}
                        {deleteProjectId === project._id && (
                            <DeleteProjectDialog
                                triggerText="Delete"
                                title="Delete Project"
                                description={
                                    <>
                                        Are you sure you want to delete the project <strong>{deleteProjectName}</strong>?
                                        <br />
                                        This action cannot be undone.
                                    </>
                                }
                                projectId={deleteProjectId}
                                projectName={deleteProjectName}
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

            {selectedRows.size > 0 && (
                <ProjectsTableFloatingBar
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
                    {uniqueHealthStatuses.length > 0 && (
                        <DataTableFacetedFilter
                            title="Health"
                            options={uniqueHealthStatuses.filter((status): status is { value: "on_track" | "at_risk" | "off_track", label: string } =>
                                status.value !== undefined
                            )}
                            selectedValues={selectedHealthStatus}
                            onChange={setSelectedHealthStatus}
                            renderOption={(option) => (
                                <div className="flex items-center space-x-2">
                                    <span>{option.label}</span>
                                </div>
                            )}
                        />
                    )}
                    {/* Category Filter Dropdown */}
                    {uniqueCategories.length > 0 && (
                        <DataTableFacetedFilter
                            title="Category"
                            options={uniqueCategories.filter((category): category is { value: string, label: string } =>
                                category.value !== undefined && category.label !== undefined
                            )}
                            selectedValues={selectedCategories}
                            onChange={setSelectedCategories}
                            renderOption={(option) => (
                                <div className="flex items-center space-x-2">
                                    <span>{option.label}</span>
                                </div>
                            )}

                        />
                    )}

                    {/* Tags Filter Dropdown */}
                    {uniqueTags.length > 0 && (
                        <DataTableFacetedFilter
                            title="Tags"
                            options={uniqueTags}
                            selectedValues={selectedTags}
                            onChange={setSelectedTags}
                            renderOption={(option) => (
                                <div className="flex items-center space-x-2">
                                    <span>{option.label}</span>
                                </div>
                            )}

                        />
                    )}

                    {/* Priority Filter Dropdown */}
                    {uniquePriorities.length > 0 && (
                        <DataTableFacetedFilter
                            title="Priority"
                            options={uniquePriorities
                                .filter(priority => priority.value !== undefined)
                                .map(priority => ({
                                    value: priority.value as string,
                                    label: priority.label
                                }))}
                            selectedValues={selectedPriorities}
                            onChange={setSelectedPriorities}
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
            {/* Add CreateTaskSheet component here */}
            {selectedProjectForTask && (
                <CreateTaskSheet
                    projectId={selectedProjectForTask}
                    open={createTaskOpen}
                    onOpenChange={(open) => {
                        setCreateTaskOpen(open);
                        if (!open) setSelectedProjectForTask(null);
                    }}
                />
            )}
        </div>
    );

}
