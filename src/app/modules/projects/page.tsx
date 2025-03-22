"use client";
// Remove the CreateProject import
// import { CreateProject } from "./components/CreateProject";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { ProjectsTable } from "./components/ProjectsTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function ProjectsPage() {
  const projectsQuery = useQuery(api.queries.projects.fetchAllProjects, {});
  const projects = projectsQuery || [];

  return (
    <AdminPanelLayout>
      <ContentLayout title="Projects">
        <div className="flex justify-between items-center mb-4">
          <div>
            {/* Page description or other content can go here */}
          </div>
          <Link href="/modules/projects/create" passHref>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Project
            </Button>
          </Link>
        </div>
        <ProjectsTable projects={projects} />
      </ContentLayout>
    </AdminPanelLayout>
  );
}
