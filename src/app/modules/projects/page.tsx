"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { ProjectsTable } from "./components/ProjectsTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Id } from "../../../../convex/_generated/dataModel";
import { TasksTable } from "./tasks/components/TasksTable";
import { useState } from "react";
import { CreateTaskSheet } from "./tasks/components/CreateTaskSheet";

export default function ProjectsPage() {
  // First, get the current user to access their company ID
  const currentUserQuery = useQuery(api.users.CurrentUser);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  // Then use the company ID to fetch projects, or skip if not available
  const projectsQuery = useQuery(
    api.queries.projects.fetchProjectsByCompany,
    currentUserQuery?.companyId as Id<"companies">
      ? { companyId: currentUserQuery?.companyId as Id<"companies"> }
      : "skip"
  );

  // Fetch all tasks for the company
  const tasksQuery = useQuery(
    api.queries.tasks.fetchAllTasks,
    currentUserQuery?.companyId as Id<"companies">
      ? { companyId: currentUserQuery?.companyId as Id<"companies"> }
      : "skip"
  );

  const projects = projectsQuery || [];
  const tasks = tasksQuery || [];

  return (
    <AdminPanelLayout>
      <ContentLayout title="Projects & Tasks Management">
        

        {/* Projects Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold">Projects</h2>
              <p className="text-muted-foreground">
                Manage your company's projects and track their progress
              </p>
            </div>
            <Link href="/modules/projects/create" passHref>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Project
              </Button>
            </Link>
          </div>
          <ProjectsTable projects={projects} />
        </div>

        {/* Tasks Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold">Tasks</h2>
              <p className="text-muted-foreground">
                View and manage tasks across all your projects
              </p>
            </div>

          </div>
          <TasksTable tasks={tasks} />
        </div>

        {/* Create Task Sheet */}
        <CreateTaskSheet
          open={createTaskOpen}
          onOpenChange={setCreateTaskOpen}
        />
      </ContentLayout>
    </AdminPanelLayout>
  );
}
