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
import { AddStory } from "./CRUD/AddStory";
import { UpdateChapter } from "../ChapterManagement/CRUD/UpdateChapter";

export type Story = {
    _id: string;
    title: string;
    description?: string;
    genre: string[];
    status: "Ongoing" | "Completed" | "Abandoned";
    isPrivate: boolean;
    rules?: string[]; // Update to string[]
    creator: string;
    creatorName: string; // New field for the display name
    followers: string[];
    createdAt: string;
    updatedAt: string;
    chapterCount?: number; // Ensure chapterCount is optional but available

};

type StoriesTableProps = {
    stories: Story[];

};


export function StoriesTable({ stories }: StoriesTableProps) {
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
    const filteredStories = React.useMemo(() => {
        return stories.filter(story => {
            // Status filter
            const statusMatch = selectedStatus.size === 0 || selectedStatus.has(story.status);

            // Privacy filter
            const privacyMatch = selectedPrivacy.size === 0 || selectedPrivacy.has(story.isPrivate.toString());

            // Date range filter
            const storyDate = new Date(story.createdAt);
            const dateMatch = (!dateRange.from || storyDate >= dateRange.from) &&
                (!dateRange.to || storyDate <= new Date(dateRange.to.getTime() + 86399999));

            // Combine all conditions
            return statusMatch && privacyMatch && dateMatch;
        });
    }, [stories, selectedStatus, selectedPrivacy, dateRange]);



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
    const privacyOptions = [
        { value: "true", label: "Private", count: stories.filter(story => story.isPrivate).length },
        { value: "false", label: "Public", count: stories.filter(story => !story.isPrivate).length },
    ];


    // Dynamically generate options from story statuses
    const dynamicOptions = React.useMemo(() => {
        const statusCounts = stories.reduce((acc, story) => {
            acc[story.status] = (acc[story.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(statusCounts).map(([status, count]) => ({
            value: status,
            label: status,
            count,
            icon: statusIcons[status as keyof typeof statusIcons], // Include corresponding icon
        }));
    }, [stories]);
    // Function to clear selected rows
    const handleClearSelection = () => {
        setSelectedRows(new Set());
        table.getRowModel().rows.forEach((row) => row.toggleSelected(false));
    };
    const columns: ColumnDef<Story>[] = [
        {
            id: "select",
            size: 50, // Adjust as needed
            minSize: 50, // Ensure a consistent small width

            header: ({ table }) => {
                const isAllSelected = table.getIsAllPageRowsSelected();
                return (
                    <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={(value) => {
                            const isChecked = value === true;
                            if (isChecked) {
                                const newSelectedRows = new Set(stories.map((story) => story._id));
                                setSelectedRows(newSelectedRows);
                                table.getRowModel().rows.forEach((row) => row.toggleSelected(true));
                            } else {
                                handleClearSelection();
                            }
                        }}
                        aria-label="Select all"
                    />
                );
            },


            cell: ({ row }) => {
                const storyId = row.original._id;
                return (
                    <Checkbox
                        checked={selectedRows.has(storyId)}
                        onCheckedChange={(value) => {
                            const isChecked = value === true;
                            const updatedSelectedRows = new Set(selectedRows);
                            if (isChecked) {
                                updatedSelectedRows.add(storyId);
                            } else {
                                updatedSelectedRows.delete(storyId);
                            }
                            setSelectedRows(updatedSelectedRows);
                            row.toggleSelected(isChecked);
                        }}
                        aria-label={`Select ${row.original.title}`}
                    />
                );
            },

        },
        {
            accessorKey: "title",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Title" />
            ),
            cell: ({ row }) => (
                <span className="font-bold">{row.original.title}</span> // Make the cell content bold
            ),
        },
        {
            accessorKey: "description",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Description" />
            ),
            cell: ({ getValue }) => {
                const text = getValue<string>();
                const maxLength = 30; // Set the desired character limit
                const truncatedText = text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
                return <span title={text}>{truncatedText}</span>;
            },
        },

        {
            accessorKey: "genre",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Genres" />
            ),
            cell: ({ row }) => {
                const genres = row.original.genre;
                const maxVisibleGenres = 2;
                const visibleGenres = genres.slice(0, maxVisibleGenres);
                const remainingGenres = genres.slice(maxVisibleGenres);

                return (
                    <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap">
                        {visibleGenres.map((genre, index) => (
                            <Badge key={index} className="px-1 py-0.5 text-xs">
                                {genre}
                            </Badge>
                        ))}
                        {remainingGenres.length > 0 && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Badge className="px-1 py-0.5 text-xs bg-gray-200">
                                            +{remainingGenres.length} more
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <span>{remainingGenres.join(", ")}</span>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                );
            },
        }

        ,
        {
            accessorKey: "status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Status" />
            ),
            cell: ({ row }) => {
                const status = row.original.status;
                const Icon = statusIcons[status as keyof typeof statusIcons]; // Get the icon based on the status
                return (
                    <div className="flex items-center space-x-2">
                        {Icon && <Icon className="w-4 h-4" />} {/* Render the icon */}
                        <span>{status}</span> {/* Display the status text */}
                    </div>
                );
            },
        },

        {
            accessorKey: "isPrivate",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Privacy" />
            ),
            cell: ({ row }) => {
                const isPrivate = row.original.isPrivate;
                return (
                    <div className="flex items-center gap-2 text-sm">
                        {isPrivate ? (
                            <>
                                <Lock className="w-4 h-4 " aria-hidden="true" />
                                <span className="leading-none">Private</span>
                            </>
                        ) : (
                            <>
                                <Unlock className="w-4 h-4 " aria-hidden="true" />
                                <span className="leading-none">Public</span>
                            </>
                        )}
                    </div>
                );
            },
        }

        ,
        {
            accessorKey: "chapterCount",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Chapters" />
            ),
            cell: ({ row }) => {
                const count = row.original.chapterCount ?? "N/A"; // Handle cases where chapterCount is undefined
                return <span>{count}</span>;
            },
        },

        {
            accessorKey: "followers",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Followers" />
            ),
            cell: ({ row }) => {
                const followers = row.original.followers; // Assuming this is an array of follower objects
                const followerCount = followers.length;

                return (
                    <div className="flex items-center rounded-full border border-border bg-background p-1 shadow shadow-black/5">
                        <p className="px-2 text-xs text-muted-foreground">
                            Trusted by <strong className="font-medium text-foreground">{followerCount}</strong> followers.
                        </p>
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
                return format(new Date(date), "MMM dd, yyyy, h:mm a"); // Use "MMM" for abbreviated month
            },
        },
        /*     {
                accessorKey: "updatedAt",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Updated At" />
                ),
                cell: ({ row }) => {
                    const date = row.original.updatedAt;
                    return format(new Date(date), "MMM dd, yyyy, h:mm a"); // Use "MMM" for abbreviated month
                },
            }, */

        {
            id: "actions",

            cell: ({ row }) => {
                const story = row.original as Story; // Assuming row.original contains the story object
                return (
                    <div className="flex justify-end ">
                        <UpdateStory storyId={story._id as Id<"stories">} />
                        {/*     <Button
                            aria-label="Labels"
                            variant="ghost"
                            className="size-8 p-0"
                        >
                            <Tags className="size-4" aria-hidden="true" />
                        </Button> */}
                        <DeleteStoryDialog
                            triggerText="Delete"
                            title="Confirm Story Deletion"
                            description={`Are you sure you want to delete the story "${story.title}"? This action cannot be undone.`}
                            storyId={story._id as Id<"stories">}
                            storyTitle={story.title}
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
        data: filteredStories, // Use filteredStories as the data source
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
                    <Input
                        placeholder="Filter by title..."
                        value={(table.getColumn("title")?.getFilterValue() as string) || ""}
                        onChange={(e) => table.getColumn("title")?.setFilterValue(e.target.value)}
                        className="w-full max-w-sm"
                    />

                    {/* Status Filter Dropdown */}
                    <DataTableFacetedFilter
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
                    />

                    {/* Privacy Filter Dropdown */}
                    <DataTableFacetedFilter
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
                                            imageSrc="/img/reflecting.png"
                                            actionComponent={<AddStory />}
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
