"use client";
import { CreateProject } from "./components/CreateProject";
import { useQuery } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api } from "../../../../convex/_generated/api";
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";

export default function ProjectsPage() {
  const projectsQuery = useQuery(api.queries.projects.fetchAllProjects, {});
  const projects = projectsQuery || [];

  return (
    <AdminPanelLayout>
      <ContentLayout title="Recent Stories">
        <div>
          <CreateProject />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {projects.map((project) => (
              <Card key={project._id}>
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Status: {project.status}</p>
                  <p>Start Date: {new Date(project.startDate).toLocaleDateString()}</p>
                  {project.endDate && <p>End Date: {new Date(project.endDate).toLocaleDateString()}</p>}
                  <p>Company ID: {project.companyId}</p>
                  <p>Team ID: {project.teamId}</p>
                  <p>Created By: {project.createdBy}</p>
                  {project.updatedBy && <p>Updated By: {project.updatedBy}</p>}
                  {project.updatedAt && <p>Updated At: {new Date(project.updatedAt).toLocaleDateString()}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ContentLayout>

    </AdminPanelLayout>

  );
}
