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
import { Users, UserPlus, MoreHorizontal, Trash2, Edit, Eye, XCircle } from "lucide-react";
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
import { DataTableFacetedFilter } from "@/components/RoleManagement/datatable/DataTableFacetedFilter";
import { CreateTeamSheet } from "./CreateTeam";
import { UpdateTeamSheet } from "./UpdateTeam"; // Add this line
import { Checkbox } from "@/components/ui/checkbox";
import DeleteTeamDialog from "./CRUD/DeleteTeamDialog";
import BulkDeleteTeamsDialog from "./CRUD/BulkDeleteTeamsDialog"; // Add this line
import { TeamTableFloatingBar } from "./TeamTableFloatingBar";
import { ViewTeamDetailsSheet } from "./ViewTeamDetails"; // Add this line
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  creatorDetails?: {
    _id: Id<"users">;
    name: string;
    email: string;
    image?: string;
  } | null;
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
    invitedBy?: {
      _id: Id<"users">;
      name: string;
      email: string;
      image?: string;
    } | null;
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
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());
  const [selectedTeamLeaders, setSelectedTeamLeaders] = useState<Set<string>>(new Set());
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false); // Add this line
  const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams"> | null>(null); // Add this line
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // Add this line
  const [deleteTeamId, setDeleteTeamId] = useState<Id<"teams"> | null>(null); // Add this line
  const [deleteTeamName, setDeleteTeamName] = useState<string>(""); // Add this line
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false); // Add this line
  const [viewDetailsTeamId, setViewDetailsTeamId] = useState<Id<"teams"> | null>(null); // Add this line
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set()); // Add this line
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set()); // Add this line

  // Fetch teams data
  const teams = useQuery(api.queries.teams.fetchTeamsByCompany, { companyId });

  // Mutations
  const createTeam = useMutation(api.mutations.teams.createTeam);
  const deleteTeam = useMutation(api.mutations.teams.deleteTeam);
  const updateTeam = useMutation(api.mutations.teams.updateTeam);

  // Extract unique creators for filtering
  const uniqueCreators = React.useMemo(() => {
    const creators = teams?.map((team) => team.creatorName).filter((creator): creator is string => !!creator);
    const uniqueCreators = Array.from(new Set(creators));
    return uniqueCreators.map((creator) => ({
      value: creator,
      label: creator,
    }));
  }, [teams]);

  // Extract unique team leaders for filtering
  const uniqueTeamLeaders = React.useMemo(() => {
    const leaders = teams?.map((team) => team.teamLeaderDetails?.name).filter((leader): leader is string => !!leader);
    const uniqueLeaders = Array.from(new Set(leaders));
    return uniqueLeaders.map((leader) => ({
      value: leader,
      label: leader,
    }));
  }, [teams]);

  // Extract unique statuses for filtering
  const uniqueStatuses = React.useMemo(() => {
    const statuses = teams?.map((team) => team.status).filter((status): status is string => !!status);
    const uniqueStatuses = Array.from(new Set(statuses));
    return uniqueStatuses.map((status) => ({
      value: status,
      label: status,
    }));
  }, [teams]);

  // Extract unique tags for filtering
  const uniqueTags = React.useMemo(() => {
    const tags = teams?.flatMap((team) => team.tags ?? []).filter((tag): tag is string => !!tag);
    const uniqueTags = Array.from(new Set(tags));
    return uniqueTags.map((tag) => ({
      value: tag,
      label: tag,
    }));
  }, [teams]);

  // Filter teams based on selected creators, team leaders, statuses, and tags
  const filteredTeams = React.useMemo(() => {
    return teams?.filter((team) => {
      const creatorMatch = selectedCreators.size === 0 || (team.creatorName && selectedCreators.has(team.creatorName));
      const leaderMatch = selectedTeamLeaders.size === 0 || (team.teamLeaderDetails?.name && selectedTeamLeaders.has(team.teamLeaderDetails.name));
      const statusMatch = selectedStatuses.size === 0 || (team.status && selectedStatuses.has(team.status));
      const tagsMatch = selectedTags.size === 0 || (team.tags && team.tags.some(tag => selectedTags.has(tag)));
      return creatorMatch && leaderMatch && statusMatch && tagsMatch;
    }) || [];
  }, [teams, selectedCreators, selectedTeamLeaders, selectedStatuses, selectedTags]);

  const resetFilters = () => {
    setSelectedCreators(new Set());
    setSelectedTeamLeaders(new Set());
    setSelectedStatuses(new Set()); // Add this line
    setSelectedTags(new Set()); // Add this line
  };

  const isFiltered = selectedCreators.size > 0 || selectedTeamLeaders.size > 0 || selectedStatuses.size > 0 || selectedTags.size > 0; // Update this line

  const handleClearSelection = () => {
    setSelectedRows(new Set());
    table.getRowModel().rows.forEach((row) => row.toggleSelected(false));
  };

  const getSelectedTeamIds = (): Id<"teams">[] => {
    return Array.from(selectedRows).map(id => id as Id<"teams">);
  };

  const statusOptions: { [key: string]: string } = {
    "Active": "bg-green-500",
    "Inactive": "bg-gray-500",
    "Archived": "bg-red-500",
    "Planning": "bg-blue-500",
    "On Hold": "bg-yellow-500",
    "Completed": "bg-purple-500"
  };

  const columns: ColumnDef<Team>[] = [
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
              const newSelectedRows = new Set((teams ?? []).map((team) => team._id));
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
        const teamId = row.original._id;
        return (
          <Checkbox
            checked={selectedRows.has(teamId)}
            onCheckedChange={(value) => {
              const isChecked = value === true;
              const updatedSelectedRows = new Set(selectedRows);
              if (isChecked) {
                updatedSelectedRows.add(teamId);
              } else {
                updatedSelectedRows.delete(teamId);
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
        <DataTableColumnHeader column={column} title="Team Name" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center space-x-2">
        <span className="font-bold">{row.getValue("name")}</span>
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
                <Avatar key={member._id} className="h-8 w-8 border-2 ">
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
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant="outline" className="inline-flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${statusOptions[status]}`}></span>
            {status}
          </Badge>
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
                <Avatar className="h-8 w-8 border-2 ">
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
      accessorKey: "creatorDetails",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created By" />
      ),
      cell: ({ row }) => {
        const creator = row.original.creatorDetails;
        return (
          <div className="flex items-center space-x-2">
            {creator ? (
              <>
                {/* Avatar Component */}
                <Avatar className="h-8 w-8 border-2 ">
                  {creator.image ? (
                    <AvatarImage 
                      src={creator.image} 
                      alt={creator.name}
                      onError={(e) => {
                        // If image fails to load, hide it so fallback shows
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  <AvatarFallback>
                    {creator.email?.[0]?.toUpperCase() || creator.name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
        
                {/* Creator Name and Email */}
                <div className="flex flex-col">
                  <span className="font-bold">{creator.name}</span>
                  <span className="text-xs text-muted-foreground block">
                    {creator.email || 'Email not available'}
                  </span>
                </div>
              </>
            ) : (
              <span className="text-muted-foreground">{row.original.creatorName || "System"}</span>
            )}
          </div>
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
        const visibleTags = tags.slice(0, maxVisibleTags);
        const remainingTags = tags.slice(maxVisibleTags);

        return (
          <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap">
            {visibleTags.map((tag, index) => (
              <Badge  key={index} className="px-1 py-0.5 text-xs">
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
              <DropdownMenuItem onClick={() => {
                setViewDetailsTeamId(team._id);
                setViewDetailsDialogOpen(true);
              }}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSelectedTeamId(team._id);
                setUpdateDialogOpen(true);
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Team
              </DropdownMenuItem>
              <DropdownMenuItem>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Members
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  setDeleteTeamId(team._id);
                  setDeleteTeamName(team.name);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Create the table instance
  const table = useReactTable({
    data: filteredTeams,
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
      {/* Floating bar (if any selection is active) */}
      {selectedRows.size > 0 && (
        <TeamTableFloatingBar table={table} setSelectedRows={setSelectedRows} />
      )}
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
           {uniqueStatuses.length > 0 && (
            <DataTableFacetedFilter
              title="Status"
              options={uniqueStatuses}
              selectedValues={selectedStatuses}
              renderOption={(option) => (
                <div className="flex items-center">
                  <span>{option.label}</span>
                </div>
              )}
              onChange={setSelectedStatuses}
            />
          )}
          {uniqueTags.length > 0 && (
            <DataTableFacetedFilter
              title="Tags"
              options={uniqueTags}
              selectedValues={selectedTags}
              renderOption={(option) => (
                <div className="flex items-center">
                  <span>{option.label}</span>
                </div>
              )}
              onChange={setSelectedTags}
            />
          )}
          {uniqueCreators.length > 0 && (
            <DataTableFacetedFilter
              title="Creators"
              options={uniqueCreators}
              selectedValues={selectedCreators}
              renderOption={(option) => (
                <div className="flex items-center">
                  <span>{option.label}</span>
                </div>
              )}
              onChange={setSelectedCreators}
            />
          )}
          {uniqueTeamLeaders.length > 0 && (
            <DataTableFacetedFilter
              title="Team Leaders"
              options={uniqueTeamLeaders}
              selectedValues={selectedTeamLeaders}
              renderOption={(option) => (
                <div className="flex items-center">
                  <span>{option.label}</span>
                </div>
              )}
              onChange={setSelectedTeamLeaders}
            />
          )}
         
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <XCircle className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="ml-auto h-8"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Users className="mr-2 h-4 w-4" />
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
      {selectedTeamId && (
        <UpdateTeamSheet
          teamId={selectedTeamId}
          open={updateDialogOpen}
          onOpenChange={setUpdateDialogOpen}
        />
      )}
      {deleteTeamId && (
        <DeleteTeamDialog
          triggerText="Delete Team"
          title="Delete Team"
          description={`Are you sure you want to delete the team "${deleteTeamName}"? This action cannot be undone.`}
          teamId={deleteTeamId}
          teamName={deleteTeamName}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        />
      )}
      {selectedRows.size > 0 && (
        <BulkDeleteTeamsDialog
          triggerText="Delete Selected Teams"
          title="Delete Teams"
          description="Are you sure you want to delete the selected teams? This action cannot be undone."
          selectedTeamIds={getSelectedTeamIds()}
          teamIds={getSelectedTeamIds()} // Add this line
        />
      )}
      {viewDetailsTeamId && (
        <ViewTeamDetailsSheet
          teamId={viewDetailsTeamId}
          open={viewDetailsDialogOpen}
          onOpenChange={setViewDetailsDialogOpen}
        />
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={getCommonPinningStyles(header)}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
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
