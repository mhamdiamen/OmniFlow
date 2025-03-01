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
import { TableViewOptions } from "@/components/RoleManagement/datatable/DataTableViewOptions";
import { ExportButton } from "@/components/ui/ExportButton";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/dateUtils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTablePagination } from "@/components/ModulesManagement/datatable/DataTablePagination";
import { CheckIcon, ChevronDown, ClockIcon, Eye, Ban, XCircle, XIcon, MoreHorizontal, UserPlus } from "lucide-react";
import { EmptyState } from "@/components/ModulesManagement/components/ReusableEmptyState";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { useQuery, useMutation } from "convex/react";
import { RevokeUserButton } from "./CRUD/RevokeUserDialog";
import { useState } from "react";
import { UserProfileSheet } from "./UserProfileSheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "./StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RevokeUserDialog } from "./CRUD/RevokeUserDialog";
import { DataTableFacetedFilter } from "@/components/RoleManagement/datatable/DataTableFacetedFilter";
import { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import InviteUserForm from "./InviteUserForm";

// Define the Company and Role types
type Company = {
  _id: string;
  name: string;
};

type Role = {
  _id: Id<"roles">;
  name: string;
};

// Modify the User type to include company and role names
// Define the User type to include invitation details
export type UserWithInvitation = {
  _id: Id<"users">;
  name?: string;
  email: string;
  image?: string;
  companyId?: string;
  companyName?: string;
  roleId?: Id<"roles">;
  roleName?: string;
  invitationStatus: "pending" | "accepted" | "rejected" | "expired" | null;
  invitationAcceptedAt: number | null;
  skills?: string[];
  certifications?: string[];
  phone?: string;
  bio?: string;
};

type UserTableProps = {
  users: UserWithInvitation[]; // Use the new type
};

export function UserTable({ users }: UserTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<UserWithInvitation | null>(null);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [userToRevoke, setUserToRevoke] = useState<Id<"users"> | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const statusOptions = [
    { value: "pending", label: "Pending", icon: ClockIcon },
    { value: "accepted", label: "Accepted", icon: CheckIcon },
    { value: "rejected", label: "Rejected", icon: XIcon },
    { value: "expired", label: "Expired", icon: ClockIcon },
  ];

  const statusMap = {
    pending: { status: "default" as const, label: "Pending", icon: ClockIcon },
    accepted: { status: "success" as const, label: "Accepted", icon: CheckIcon },
    rejected: { status: "error" as const, label: "Rejected", icon: XIcon },
    expired: { status: "default" as const, label: "Expired", icon: ClockIcon },
  };

  const roles = useQuery(api.queries.roles.getRoles) || [];
  const updateUserRole = useMutation(api.mutations.users.updateUserRole);

  const handleRoleChange = async (userId: Id<"users">, newRoleId: Id<"roles">) => {
    try {
      await updateUserRole({ userId, newRoleId });
      // No need to update local state. Convex will handle it!
    } catch (error) {
      console.error("Failed to update user role:", error);
    }
  };

  // Extract unique roles for filtering
  const uniqueRoles = React.useMemo(() => {
    const roles = users.map((user) => user.roleName).filter((role): role is string => !!role);
    const uniqueRoles = Array.from(new Set(roles));
    return uniqueRoles.map((role) => ({
      value: role,
      label: role,
    }));
  }, [users]);

  // Filter users based on selected roles and statuses
  const filteredUsers = React.useMemo(() => {
    return users.filter((user) => {
      const roleMatch = selectedRoles.size === 0 || (user.roleName && selectedRoles.has(user.roleName));
      const statusMatch = selectedStatuses.size === 0 || (user.invitationStatus && selectedStatuses.has(user.invitationStatus));
      return roleMatch && statusMatch;
    });
  }, [users, selectedRoles, selectedStatuses]);

  const resetFilters = () => {
    setSelectedRoles(new Set());
    setSelectedStatuses(new Set());
  };

  const isFiltered = selectedRoles.size > 0 || selectedStatuses.size > 0;

  const handleClearSelection = () => {
    setSelectedRows(new Set());
    table.getRowModel().rows.forEach((row) => row.toggleSelected(false));
  };

  const columns: ColumnDef<UserWithInvitation>[] = [
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
      id: "user",
      header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
      cell: ({ row }) => {
        const { name, email, image } = row.original;
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={image} alt={name || email} />
              <AvatarFallback>{name?.charAt(0).toUpperCase() || email.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold">{name || "N/A"}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "roleName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
      cell: ({ row }) => {
        const roleName = row.original.roleName;
        return (
          <div className="flex items-center">
            <Badge >{roleName || "No Role"}</Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "invitationStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Invitation Status" />
      ),
      cell: ({ row }) => {
        const status = row.original.invitationStatus;
        if (!status) return "N/A";

        const { status: badgeStatus, label, icon: Icon } = statusMap[status] || {
          status: "default" as "default",
          label: status,
        };

        return (
          <StatusBadge
            status={badgeStatus}
            leftLabel={label}
            leftIcon={Icon}
            className="text-sm"
          />
        );
      },
    },
    {
      accessorKey: "invitationAcceptedAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
      cell: ({ row }) => {
        const date = row.original.invitationAcceptedAt;
        return (
          <div className="flex items-center">
            <span className="font-medium">{date ? formatDate(date) : "Not joined"}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="relative h-8 w-8 p-0 data-[state=open]:bg-accent"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">User Management</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => setSelectedUser(user)}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                <span>View details</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Access Control</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => {
                  setUserToRevoke(user._id);
                  setRevokeDialogOpen(true);
                }}
                className="cursor-pointer"
              >
                <Ban className="mr-2 h-4 w-4" />
                <span>Revoke access</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 40,
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

  const currentUser = useQuery(api.users.CurrentUser);
  const currentCompany = useQuery(api.queries.company.getCompanyByOwner);

  return (
    <div>
      {/* Floating bar (if any selection is active) */}
      {selectedRows.size > 0 && (
        <StaticTasksTableFloatingBar table={table} setSelectedRows={setSelectedRows} />
      )}
      
      {/* UserProfileSheet Modal */}
      {selectedUser && (
        <UserProfileSheet
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          user={selectedUser}
        />
      )}
      
      {/* Revoke User Dialog */}
      {userToRevoke && (
        <RevokeUserDialog
          userId={userToRevoke}
          isOpen={revokeDialogOpen}
          onOpenChange={(open) => {
            setRevokeDialogOpen(open);
            if (!open) setUserToRevoke(null);
          }}
        />
      )}

      <div className="flex items-center justify-between py-4">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter by name..."
            value={(table.getColumn("user")?.getFilterValue() as string) || ""}
            onChange={(e) => table.getColumn("user")?.setFilterValue(e.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />

          {uniqueRoles.length > 0 && (
            <DataTableFacetedFilter
              title="Roles"
              options={uniqueRoles}
              selectedValues={selectedRoles}
              renderOption={(option) => (
                <div className="flex items-center">
                  <span>{option.label}</span>
                </div>
              )}
              onChange={setSelectedRoles}
            />
          )}

          <DataTableFacetedFilter
            title="Status"
            options={statusOptions}
            selectedValues={selectedStatuses}
            renderOption={(option) => (
              <div className="flex items-center">
                {option.icon && (
                  <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                )}
                <span>{option.label}</span>
              </div>
            )}
            onChange={setSelectedStatuses}
          />

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
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setInviteDialogOpen(true)}
            className="ml-auto"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <TableViewOptions
            columns={table
              .getAllColumns()
              .filter(
                (column) =>
                  column.id !== "select" && column.id !== "actions"
              )
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                    <TableCell key={cell.id}>
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-md md:max-w-2xl lg:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <UserPlus className="h-5 w-5 text-primary" />
              Invite New User
            </DialogTitle>
            <DialogDescription className="text-base">
              Send an invitation to a new user to join your company's workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-muted/30">
            {currentUser && currentCompany ? (
              <InviteUserForm 
                companyId={currentCompany._id} 
                invitedBy={currentUser._id} 
              />
            ) : (
              <div className="flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Loading user information...</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}