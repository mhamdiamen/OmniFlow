"use client";

import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Card } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { RolesTable } from "@/components/RoleManagement/RolesTable";
import { AddRole } from "@/components/RoleManagement/CRUD/AddRole";
import { AddPermission } from "@/components/PermissionsManagement/CRUD/AddPermission";
import { PermissionsTable } from "@/components/PermissionsManagement/PermissionsTable";

export default function Test() {
    const rawRoles = useQuery(api.queries.roles.getRoles);
    const rawPermissions = useQuery(api.queries.permissions.fetchAllPermissions);

    console.log("Raw Permissions:", rawPermissions); // Debugging: Check fetched data

    // Transform _creationTime into createdAt
    const roles = rawRoles?.map(role => ({
        ...role,
        createdAt: new Date(role._creationTime).toISOString(),
    })) || [];

    const permissions = rawPermissions?.map(permission => ({
        ...permission,
        createdAt: new Date(permission._creationTime).toISOString(),
        assignedRoles: permission.assignedRoles || [], // Ensure assignedRoles is included
    })) || [];

    console.log("Transformed Permissions:", permissions); // Debugging: Check transformed data

    return (
        <AdminPanelLayout>
            <ContentLayout title="Dashboard">
         
                {/* Add Role Component */}
                <AddRole />

                {/* Roles Table */}
                <div className="mt-6">
                    {rawRoles ? <RolesTable roles={roles} /> : <p>Loading roles...</p>}
                </div>

                {/* Add Permission Component */}
                <AddPermission />

                {/* Permissions Table */}
                <div className="mt-6">
                    {rawPermissions ? <PermissionsTable permissions={permissions} /> : <p>Loading permissions...</p>}
                </div>
            </ContentLayout>
        </AdminPanelLayout>
    );
}
