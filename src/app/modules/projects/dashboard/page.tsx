"use client";

import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import TaskDashboard from "./components/TaskDashboard";

export default function ProjectsPage() {


    return (
        <AdminPanelLayout>
            <ContentLayout title="Projects & Tasks Management">


                <TaskDashboard />

            </ContentLayout>
        </AdminPanelLayout>
    );
}
