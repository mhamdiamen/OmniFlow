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
import { getCommonPinningStyles } from "@/lib/data-table"
import { Checkbox } from "../ui/checkbox";
import { ExportButton } from "../ui/ExportButton";
import { Bell, CheckCircle, Circle, CircleCheck, CircleCheckBig, CircleX, Clock, Ellipsis, FileText, Heart, Home, Loader, Settings, Star, Lock, Unlock, User, XCircle, EditIcon, Tags, TrashIcon } from "lucide-react";
import { format } from "date-fns";
import { Id } from "../../../convex/_generated/dataModel";
import { DataTableColumnHeader } from "../StoryManagement/datatable/DataTableColumnHeader";
import DeleteStoryDialog from "../StoryManagement/CRUD/DeleteStoryDialog";
import { UpdateStory } from "../StoryManagement/CRUD/UpdateStory";
import DateRangePicker from "../StoryManagement/components/DateRangePicker";
import { EmptyState } from "../StoryManagement/components/ReusableEmptyState";
import { DataTableFacetedFilter } from "../StoryManagement/datatable/DataTableFacetedFilter";
import { DataTablePagination } from "../StoryManagement/datatable/DataTablePagination";
import { TableViewOptions } from "../StoryManagement/datatable/DataTableViewOptions";
import DeleteChapterDialog from "./CRUD/DeleteChapterDialog";
import { UpdateChapter } from "./CRUD/UpdateChapter";
import { EnrichedChapter } from "@/types";
import { StaticTasksTableFloatingBar } from "./StaticTasksTableFloatingBar";
import { AddChapter } from "./CRUD/AddChapter";
import { Badge } from "../ui/badge";


type ChaptersTableProps = {
    chapters: EnrichedChapter[];
};

export function ChaptersTable({ chapters }: ChaptersTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
    const [isDraftFilter, setIsDraftFilter] = React.useState<boolean | null>(null); // New state for isDraft filter
    const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    });

    // Determine if any filters are applied
    const isFiltered = isDraftFilter !== null;

    // Filter chapters based on `isDraft` and `createdAt`/`updatedAt`
    const filteredChapters = React.useMemo(() => {
        return chapters.filter((chapter) => {
            // `isDraft` filter
            const isDraftMatch = isDraftFilter === null || chapter.isDraft === isDraftFilter;

            // Date range filter
            const createdAt = new Date(chapter.createdAt);
            const updatedAt = new Date(chapter.updatedAt);
            const dateMatch =
                (!dateRange.from || createdAt >= dateRange.from || updatedAt >= dateRange.from) &&
                (!dateRange.to || createdAt <= new Date(dateRange.to.getTime() + 86399999) || updatedAt <= new Date(dateRange.to.getTime() + 86399999));

            // Combine all conditions
            return isDraftMatch && dateMatch;
        });
    }, [chapters, isDraftFilter, dateRange]);

    const resetFilters = () => {
        setIsDraftFilter(null);
        // No change to dateRange
    };


    // Function to clear selected rows
    const handleClearSelection = () => {
        setSelectedRows(new Set());
        table.getRowModel().rows.forEach((row) => row.toggleSelected(false));
    };
    type Chapter = {
        _id: string;
        storyId: string;
        content: string;
        author: string;
        createdAt: string;
        updatedAt: string;
    };

    const columns: ColumnDef<EnrichedChapter>[] = [
        {
            id: "select",
            size: 50,
            minSize: 50,
            header: ({ table }) => {
                const isAllSelected = table.getIsAllPageRowsSelected();
                return (
                    <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={(value) => {
                            const isChecked = value === true;
                            if (isChecked) {
                                const newSelectedRows = new Set(chapters.map((chapter) => chapter._id));
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
                const chapterId = row.original._id;
                return (
                    <Checkbox
                        checked={selectedRows.has(chapterId)}
                        onCheckedChange={(value) => {
                            const isChecked = value === true;
                            const updatedSelectedRows = new Set(selectedRows);
                            if (isChecked) {
                                updatedSelectedRows.add(chapterId);
                            } else {
                                updatedSelectedRows.delete(chapterId);
                            }
                            setSelectedRows(updatedSelectedRows);
                            row.toggleSelected(isChecked);
                        }}
                        aria-label={`Select chapter ${chapterId}`}
                    />
                );
            },
        },
        {
            accessorKey: "chapterTitle",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Chapter Title" />
            ),
            cell: ({ row }) => <span className="font-bold">{row.original.chapterTitle}</span>,
        },
        {
            accessorKey: "storyTitle",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Story Title" />
            ),
            cell: ({ row }) => <span className="font-bold">{row.original.storyTitle}</span>,
        },
        {
            accessorKey: "authorName",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Author" />
            ),
            cell: ({ row }) => <span>{row.original.authorName}</span>,
        },
        {
            accessorKey: "content",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Content" />
            ),
            cell: ({ getValue }) => {
                const text = getValue<string>();
                const maxLength = 40;
                const truncatedText = text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
                return <span title={text}>{truncatedText}</span>;
            },
        },
        {
            accessorKey: "wordCount",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Word Count" />
            ),
            cell: ({ row }) => {
                const wordCount = row.original.wordCount;
                return (
                    <Badge variant="outline" className="min-w-5 px-1 flex items-center justify-center">
                        {wordCount !== undefined ? wordCount : "N/A"}
                    </Badge>
                );
            },
        },



        {
            accessorKey: "isDraft",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Draft" />
            ),
            cell: ({ row }) => {
                const isDraft = row.original.isDraft;
                return (
                    <Badge
                        variant="default" // Customize badge variants for draft and non-draft
                    >
                        {isDraft ? "Draft" : "Published"}
                    </Badge>
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
                return date ? format(new Date(date), "MMM dd, yyyy, h:mm a") : "N/A";
            },
        },
        /*  {
             accessorKey: "updatedAt",
             header: ({ column }) => (
                 <DataTableColumnHeader column={column} title="Updated At" />
             ),
             cell: ({ row }) => {
                 const date = row.original.updatedAt;
                 return date ? format(new Date(date), "MMM dd, yyyy, h:mm a") : "N/A";
             },
         }, */
        {
            id: "actions",
            header: "Actions", // Optional, static title
            cell: ({ row }) => {
                const chapter = row.original;
                return (
                    <div className="flex justify-end">
                        {/* Actions like update and delete go here */}
                        <UpdateChapter chapterId={chapter._id as Id<"chapters">} />

                        <DeleteChapterDialog
                            triggerText="Delete"
                            title="Confirm Chapter Deletion"
                            description={`Are you sure you want to delete the chapter "${chapter.chapterTitle}"? This action cannot be undone.`}
                            chapterId={chapter._id as Id<"chapters">}
                            chapterTitle={chapter.chapterTitle}
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
        data: filteredChapters, // Use filteredChapters as the data source
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
                        placeholder="Filter by chapter title..."
                        value={(table.getColumn("chapterTitle")?.getFilterValue() as string) || ""}
                        onChange={(e) => table.getColumn("chapterTitle")?.setFilterValue(e.target.value)}
                        className="w-full max-w-sm"
                    />


                    <DataTableFacetedFilter
                        title="Draft Status"
                        options={[
                            { value: "true", label: "Draft", count: chapters.filter((c) => c.isDraft).length },
                            { value: "false", label: "Published", count: chapters.filter((c) => !c.isDraft).length },
                        ]}
                        selectedValues={isDraftFilter === null ? new Set() : new Set([isDraftFilter ? "true" : "false"])}
                        renderOption={(option) => (
                            <div className="flex items-center space-x-2">
                                <span>{option.label}</span>
                                <span className="text-gray-500">({option.count})</span>
                            </div>
                        )}
                        onChange={(values) => {
                            if (values.size === 0) setIsDraftFilter(null);
                            else setIsDraftFilter(values.has("true"));
                        }}
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
                        onDateRangeChange={setDateRange}
                    />

                    <ExportButton
                        table={table}
                        filename="Chapters"
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
                                            title="No Chapters Yet"
                                            description="Create your first chapter to start building your story. It's quick and easy!"
                                            imageSrc="/img/reflecting.png"
                                            actionComponent={<AddChapter />}
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
