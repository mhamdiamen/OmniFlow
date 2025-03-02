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
import { TableViewOptions } from "@/components/RoleManagement/datatable/DataTableViewOptions";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/dateUtils";
import { DataTablePagination } from "@/components/ModulesManagement/datatable/DataTablePagination";
import { Users, UserPlus, MoreHorizontal, Trash2, Edit, Eye } from "lucide-react";
import { EmptyState } from "@/components/ModulesManagement/components/ReusableEmptyState";
import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateTeamSheet } from "./CreateTeam";

// Define the Team type based on your schema
export type Team = {
  _id: Id<"teams">;
  name: string;
  companyId: Id<"companies">;
  createdBy: Id<"users">;
  createdAt: number;
  members: Id<"users">[];
  memberCount: number;
  creatorName: string;
  teamLeaderId?: Id<"users">;
  teamLeaderDetails?: {
    _id: Id<"users">;
    name: string;
    email: string;
    image?: string;
  } | null;
  memberDetails: {
    _id: Id<"users">;
    name: string;
    email: string;
    image?: string;
  }[];
};

type TeamsTableProps = {
  companyId: Id<"companies">;
};

export function TeamsTable({ companyId }: TeamsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch teams data
  const teams = useQuery(api.queries.teams.fetchTeamsByCompany, { companyId });

  // Mutations
  const createTeam = useMutation(api.mutations.teams.createTeam);
  const deleteTeam = useMutation(api.mutations.teams.deleteTeam);
  const updateTeam = useMutation(api.mutations.teams.updateTeam);

  const columns: ColumnDef<Team>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Team Name" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center space-x-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <span className="font-medium">{row.getValue("name")}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "memberDetails",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Members" />
      ),
      cell: ({ row }) => {
        const members = row.original.memberDetails;
        const totalCount = row.original.memberCount;
        const displayCount = 3; // Number of avatars to display

        return (
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {members.slice(0, displayCount).map((member, i) => (
                <Avatar key={member._id} className="h-8 w-8 border-2 border-white">
                  {member.image ? (
                    <AvatarImage 
                      src={member.image} 
                      alt={member.name}
                      onError={(e) => {
                        // If image fails to load, hide it so fallback shows
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  <AvatarFallback>
                    {member.email?.[0]?.toUpperCase() || member.name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              ))}
              {totalCount > displayCount && (
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                  +{totalCount - displayCount}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "teamLeaderDetails",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Team Leader" />
      ),
      cell: ({ row }) => {
        const teamLeader = row.original.teamLeaderDetails;
        return (
          <div className="flex items-center space-x-2">
            {teamLeader ? (
              <>
                {/* Avatar Component */}
                <Avatar className="h-8 w-8 border-2 border-white">
                  {teamLeader.image ? (
                    <AvatarImage 
                      src={teamLeader.image} 
                      alt={teamLeader.name}
                      onError={(e) => {
                        // If image fails to load, hide it so fallback shows
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  <AvatarFallback>
                    {teamLeader.email?.[0]?.toUpperCase() || teamLeader.name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
        
                {/* Team Leader Name and Email */}
                <div className="flex flex-col"> {/* Ensures vertical stacking */}
                  <span className="font-bold">{teamLeader.name}</span>
                  <span className="text-xs text-muted-foreground block">
                    {teamLeader.email || 'Email not available'}
                  </span>
                </div>
              </>
            ) : (
              <span className="text-muted-foreground">Not assigned</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "creatorName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created By" />
      ),
      cell: ({ row }) => {
        return <div className="font-medium">{row.original.creatorName}</div>;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        return <div>{formatDate(row.original.createdAt)}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const team = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(team._id)}>
                Copy Team ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit Team
              </DropdownMenuItem>
              <DropdownMenuItem>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Members
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: teams || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  if (!teams) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Filter by name..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="ml-auto h-8"
            onClick={() => setCreateDialogOpen(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Create Team
          </Button>
          <TableViewOptions 
            columns={table.getAllColumns().map(column => ({
              id: column.id,
              isVisible: column.getIsVisible(),
              toggleVisibility: () => column.toggleVisibility(),
              canHide: column.id !== "actions"
            }))}
          />
        </div>
      </div>
      
      <CreateTeamSheet
        companyId={companyId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} style={getCommonPinningStyles(header)}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={getCommonPinningStyles(cell)}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <EmptyState
                    title="No teams found"
                    description="Create a team to start collaborating with others."
                    actionComponent={
                      <Button onClick={() => setCreateDialogOpen(true)}>
                        <Users className="mr-2 h-4 w-4" />
                        Create Team
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
