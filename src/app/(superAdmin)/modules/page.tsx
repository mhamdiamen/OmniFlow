"use client";

import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ModulesTable } from "@/components/ModulesManagement/ModulesTable";
import { AddModule } from "@/components/ModulesManagement/CRUD/AddModule";

export default function Test() {
    // Fetch raw modules data from Convex.
    const rawModules = useQuery(api.queries.modules.fetchAllModules, {});

    // For modules, we assume the query returns the modules in the expected format.
    const modules = rawModules || [];

    // Loading state: wait until the query is defined.
    const isLoading = !rawModules;

    return (
        <AdminPanelLayout>
            <ContentLayout title="Dashboard">
                {/* Modules Section */}
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                            Module Management
                        </h1>
                        <AddModule />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        Manage and oversee application modules and their associated permissions.
                    </p>
                    {isLoading ? (
                        <Skeleton className="h-[300px] w-full" />
                    ) : (
                        <ModulesTable modules={modules} />
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
