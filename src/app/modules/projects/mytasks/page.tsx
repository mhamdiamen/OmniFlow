// app/(app)/admin-panel/tasks/page.tsx
"use client";

import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { useQuery } from 'convex/react';
import { Skeleton } from "@/components/ui/skeleton";
import { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { useState } from "react";
import { SearchWithLoader } from "@/components/searchWithLoader";
import { KanbanView } from "./KanbanView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, LayoutGrid, Table } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { TasksTable } from "../tasks/components/TasksTable";
import Component from "@/app/modules/projects/mytasks/TaskCalendar";
import TaskCalendar from "@/app/modules/projects/mytasks/TaskCalendar";

export default function MyTasksPage() {
  // Get current user
  const currentUser = useQuery(api.users.CurrentUser);

  // State for search and selected project
  const [searchQuery, setSearchQuery] = useState("");
  const [autoSelectedProjectId, setAutoSelectedProjectId] = useState<Id<"projects"> | null>(null);

  // Fetch projects count for the badge
  const projectsData = useQuery(
    api.queries.projects.fetchProjectsByTeam,
    currentUser?.teamId
      ? { teamId: currentUser.teamId as Id<"teams"> }
      : "skip"
  );

  // Fetch all tasks for the current user
  const tasks = useQuery(
    api.queries.tasks.fetchAllTasksByAssignee,
    currentUser?._id
      ? {
        assigneeId: currentUser._id as Id<"users">,
      }
      : "skip"
  );

  const projectsCount = projectsData?.length || 0;

  if (!currentUser) {
    return (
      <AdminPanelLayout>
        <ContentLayout title="My Tasks">
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </ContentLayout>
      </AdminPanelLayout>
    );
  }

  return (
    <AdminPanelLayout>
      <ContentLayout title="My Tasks">
        <div className="flex flex-col h-full">
          {/* Tabs for view selection */}
          <Tabs defaultValue="kanban" className="flex-1 flex flex-col">
            <ScrollArea className="w-full">
              <TabsList className="mb-3">
                <TabsTrigger value="kanban" className="group">
                  <LayoutGrid
                    className="-ms-0.5 me-1.5 opacity-60"
                    size={16}
                    aria-hidden="true"
                  />
                  Kanban
                  <Badge
                    className="bg-primary/15 ms-1.5 min-w-5 px-1 transition-opacity group-data-[state=inactive]:opacity-50"
                    variant="secondary"
                  >
                    {projectsCount}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="table" className="group">
                  <Calendar
                    className="-ms-0.5 me-1.5 opacity-60"
                    size={16}
                    aria-hidden="true"
                  />
                  Calendar
                  <Badge
                    className="bg-primary/15 ms-1.5 min-w-5 px-1 transition-opacity group-data-[state=inactive]:opacity-50"
                    variant="secondary"
                  >
                    {tasks?.length ?? 0}
                  </Badge>
                </TabsTrigger>
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {/* Kanban View Tab */}
            <TabsContent value="kanban" className="flex-1 flex flex-col">
              {/* Search bar inside Kanban tab */}
              <div className="mb-6 max-w-md">
                <SearchWithLoader
                  placeholder="Search projects by name..."
                  onSearch={setSearchQuery}
                  debounceTime={300}
                  showMic={false}
                />
              </div>

              <KanbanView
                teamId={currentUser.teamId as Id<"teams">}
                searchQuery={searchQuery}
                autoSelectedProjectId={autoSelectedProjectId}
              />
            </TabsContent>

            {/* Table View Tab */}
            <TabsContent value="table" className="flex-1">
              {!tasks ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="flex justify-center items-center py-10">
                  <p className="text-muted-foreground">No tasks assigned to you</p>
                </div>
              ) : (
                <TaskCalendar />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ContentLayout>
    </AdminPanelLayout>
  );
}