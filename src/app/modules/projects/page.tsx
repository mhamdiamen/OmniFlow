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

export default function ProjectsPage() {
  // First, get the current user to access their company ID
  const currentUserQuery = useQuery(api.users.CurrentUser);

  // Then use the company ID to fetch projects, or skip if not available
  const projectsQuery = useQuery(
    api.queries.projects.fetchProjectsByCompany,
    currentUserQuery?.companyId as Id<"companies">
      ? { companyId: currentUserQuery?.companyId as Id<"companies"> }
      : "skip"
  );

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
