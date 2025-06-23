// components/kanban-view.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from 'convex/react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Folder, HashIcon } from "lucide-react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { SubtaskKanbanBoard } from "./board/SubtaskKanbanBoard";

interface KanbanViewProps {
  teamId: Id<"teams">;
  searchQuery: string;
  autoSelectedProjectId: Id<"projects"> | null;
}

export function KanbanView({ teamId, searchQuery, autoSelectedProjectId }: KanbanViewProps) {
  // Fetch projects by team ID
  const projectsData = useQuery(
    api.queries.projects.fetchProjectsByTeam,
    teamId
      ? { teamId }
      : "skip"
  );

  // Filter projects based on search query
  const filteredProjects = projectsData?.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Determine default tab value
  const defaultTabValue = autoSelectedProjectId
    ? `project-${autoSelectedProjectId}`
    : filteredProjects.length > 0
      ? `project-${filteredProjects[0]._id}`
      : undefined;

  if (!projectsData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden">
      {filteredProjects.length > 0 ? (
        <Tabs
          defaultValue={defaultTabValue}
          value={autoSelectedProjectId ? `project-${autoSelectedProjectId}` : undefined}
          orientation="vertical"
          className="flex h-full w-full gap-2"
        >
          <div className="flex flex-col h-full border-r  border-border w-[250px]">
            {/* Projects header with icon */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Folder className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium text-sm">Projects</h3>
            </div>

            <TabsList className="flex-col rounded-none bg-transparent p-0 h-full overflow-y-auto">
              {filteredProjects.map((project) => (
                <TabsTrigger
                  key={project._id}
                  value={`project-${project._id}`}
                  className="relative flex items-center w-full gap-2 rounded-none px-4 py-2 text-left justify-start data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
                >
                  <HashIcon className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                  <span className="font-semibold truncate max-w-[180px] text-left">
                    {project.name}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 h-full">
            {filteredProjects.map((project) => (
              <TabsContent key={project._id} value={`project-${project._id}`} className="h-full">
                <SubtaskKanbanBoard projectId={project._id} />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      ) : (
        <div className="flex justify-center items-center py-10">
          <p className="text-muted-foreground">
            {searchQuery.trim() === ""
              ? "No projects found for your team."
              : "No projects match your search."}
          </p>
        </div>
      )}
    </div>
  );
}