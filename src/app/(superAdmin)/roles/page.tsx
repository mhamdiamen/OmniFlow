"use client";

import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { RolesTable } from "@/components/RoleManagement/RolesTable";
import { AddRole } from "@/components/RoleManagement/CRUD/AddRole";
import { AddPermission } from "@/components/PermissionsManagement/CRUD/AddPermission";
import { PermissionsTable } from "@/components/PermissionsManagement/PermissionsTable";
import { Skeleton } from "@/components/ui/skeleton"; // Assuming you have a Skeleton component
import { Spinner } from "@/components/ui/spinner";

export default function Test() {
    // Fetch raw roles and permissions data
    const rawRoles = useQuery(api.queries.roles.getRoles);
    const rawPermissions = useQuery(api.queries.permissions.fetchAllPermissions);

    // Transform _creationTime into createdAt for roles
    const roles = rawRoles?.map(role => {
        const createdAt = new Date(role._creationTime).toISOString();
        return {
            ...role,
            createdAt,
        };
    }) || [];

    // Transform _creationTime into createdAt for permissions
    const permissions = rawPermissions?.map(permission => {
        const createdAt = new Date(permission._creationTime).toISOString();
        return {
            ...permission,
            createdAt,
            assignedRoles: permission.assignedRoles || [], // Ensure assignedRoles is included
        };
    }) || [];

    // Loading state
    const isLoading = !rawRoles || !rawPermissions;

    return (
        <AdminPanelLayout>
            <ContentLayout title="Dashboard">
                {/* Roles Section */}
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                            Role Management
                        </h1>
                        <AddRole />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        Manage and oversee user roles within the system. Roles define access levels and permissions for different users.
                    </p>
                    {isLoading ? (
                        <Skeleton className="h-[300px] w-full" />
                    ) : (
                        <RolesTable roles={roles} />
                    )}
                </div>

                {/* Permissions Section */}
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                            Permission Management
                        </h1>
                        <AddPermission />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        Define and manage permissions that can be assigned to roles. Permissions control access to specific features and resources.
                    </p>
                    {isLoading ? (
                        <Skeleton className="h-[300px] w-full" />
                    ) : (
                        <PermissionsTable permissions={permissions} />
                    )}
                </div>

                {/* Loading Spinner */}
                {isLoading && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <Spinner size="sm" className="bg-black dark:bg-white" />
                    </div>
                )}
            </ContentLayout>
        </AdminPanelLayout>
    );
}