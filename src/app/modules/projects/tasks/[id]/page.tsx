"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import BlockPreview from "@/components/BlockPreview";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ArrowLeft, Calendar, CheckCircle, AlertTriangle, XCircle, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/ui/timeline";

export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const projectId = params.id as Id<"projects">;
  
  // Fetch project details
  const project = useQuery(api.queries.projects.getProjectById, { 
    projectId 
  });
  
  // Fetch team details if available
  const team = useQuery(
    api.queries.teams.fetchTeamById,
    project?.teamId ? { teamId: project.teamId as Id<"teams"> } : "skip"
  );
  
  // Fetch creator details
  const creator = useQuery(
    api.queries.users.getUserById,
    project?.createdBy ? { userId: project.createdBy as Id<"users"> } : "skip"
  );

  // State for the project content
  const [projectContent, setProjectContent] = useState<string>("");

  // Load project content when project data is available
  useEffect(() => {
    if (project?.description) {
      setProjectContent(project.description);
    }
  }, [project]);

  // Helper function to render health status badge
  const renderHealthStatusBadge = (status?: string) => {
    switch (status) {
      case "on_track":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>On Track</span>
          </Badge>
        );
      case "at_risk":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>At Risk</span>
          </Badge>
        );
      case "off_track":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3.5 w-3.5" />
            <span>Off Track</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <span>Not Set</span>
          </Badge>
        );
    }
  };

  // Helper function to render status badge
  const renderStatusBadge = (status?: string) => {
    const statusColors: Record<string, string> = {
      "planned": "bg-blue-500",
      "in_progress": "bg-green-500",
      "completed": "bg-purple-500",
      "on_hold": "bg-amber-500",
      "canceled": "bg-red-500"
    };

    const statusLabels: Record<string, string> = {
      "planned": "Planned",
      "in_progress": "In Progress",
      "completed": "Completed",
      "on_hold": "On Hold",
      "canceled": "Canceled"
    };

    return (
      <Badge variant="outline" className="inline-flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${status ? statusColors[status] : "bg-gray-500"} flex-shrink-0`}></div>
        <span>{status ? statusLabels[status] : "Unknown"}</span>
      </Badge>
    );
  };

  // Helper function to render priority badge
  const renderPriorityBadge = (priority?: string) => {
    const priorityColors: Record<string, string> = {
      "low": "bg-blue-100 text-blue-800 border-blue-200",
      "medium": "bg-green-100 text-green-800 border-green-200",
      "high": "bg-amber-100 text-amber-800 border-amber-200",
      "critical": "bg-red-100 text-red-800 border-red-200"
    };

    const priorityLabels: Record<string, string> = {
      "low": "Low",
      "medium": "Medium",
      "high": "High",
      "critical": "Critical"
    };

    return (
      <Badge variant="outline" className={`${priority ? priorityColors[priority] : "bg-gray-100 text-gray-800 border-gray-200"}`}>
        {priority ? priorityLabels[priority] : "Not Set"}
      </Badge>
    );
  };

  return (
    <AdminPanelLayout>
      <ContentLayout title="Project Details">
        <div className="flex  mb-6 w-full">
       
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
        </div>

        <div className="w-full ml-0 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left column - Project details */}
            <div className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
               
                
                {/* Project Name */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-4xl font-bold">
                      {project ? project.name : <Skeleton className="h-12 w-full" />}
                    </h2>
                    {project ? renderStatusBadge(project.status) : <Skeleton className="h-6 w-24" />}
                  </div>
                  
                  {/* Tags moved under project name */}
                  <div className="mt-3">
                    {project ? (
                      project.tags && project.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {project.tags.map((tag, index) => (
                            <Badge key={index} >{tag}</Badge>
                          ))}
                        </div>
                      ) : <span className="text-muted-foreground text-sm">No tags</span>
                    ) : <Skeleton className="h-5 w-full" />}
                  </div>
                </div>
                
                {/* Divider between project name/tags and team */}
                <Separator className="my-4" />
                    
                {/* Team */}
                <div className="flex items-center gap-4">
                  <Label className="w-32 ">Team</Label>
                  <div className="flex-1 py-2 px-3">
                    {team ? (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <span className="cursor-help font-bold">{team.name}</span>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="text-sm font-bold ">{team.name}</h4>
                            {team.description && (
                              <p className="text-sm text-muted-foreground">{team.description}</p>
                            )}
                            <div className="flex items-center pt-2">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Created {team._creationTime ? format(new Date(team._creationTime), "MMM d, yyyy") : "N/A"}
                              </span>
                            </div>
                            {team.members && team.members.length > 0 && (
                              <div className="flex items-center pt-1">
                                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ) : project?.teamId ? (
                      <Skeleton className="h-5 w-full" />
                    ) : (
                      "No team assigned"
                    )}
                  </div>
                </div>
                
                {/* Category */}
                <div className="flex items-center gap-4">
                  <Label className="w-32 ">Category</Label>
                  <div className="flex-1 py-2 px-3 font-bold ">
                    {project ? (project.category || "No category") : <Skeleton className="h-5 w-full" />}
                  </div>
                </div>
                
              
              </div>
              
              {/* Project Status Section */}
              <div className="space-y-4 pt-2">
                <div className="mb-2">
                  <h3 className="text-lg font-bold">Project Status</h3>
                  <p className="text-muted-foreground text-sm">
                    Current state and importance of the project.
                  </p>
                </div>
                
            
                {/* Priority */}
                <div className="flex items-center gap-4">
                  <Label className="w-32 ">Priority</Label>
                  <div className="flex items-center  py-2 px-3">
                    {project ? renderPriorityBadge(project.priority) : <Skeleton className="h-5 w-full" />}
                  </div>
                </div>

                {/* Health Status */}
                <div className="flex items-center gap-4">
                  <Label className="w-32 ">Health Status</Label>
                  <div className="flex items-center  py-2 px-3">
                    {project ? renderHealthStatusBadge(project.healthStatus) : <Skeleton className="h-5 w-full" />}
                  </div>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="space-y-4 pt-2">
                <div className="mb-2">
                  <h3 className="text-lg font-bold">Timeline</h3>
                  <p className="text-muted-foreground text-sm">
                    Project duration and dates.
                  </p>
                </div>
                
                {/* Custom Timeline Implementation */}
                <div className="mt-4 px-2">
                  {project ? (
                    <div className="relative">
                      {/* Timeline Line */}
                      <div className="absolute top-4 left-0 right-0 h-0.5 bg-border"></div>
                      
                      {/* Timeline Points */}
                      <div className="flex justify-between relative">
                        {/* Start Date */}
                        <div className="flex flex-col items-center z-10">
                          <div className="w-8 h-8 rounded-full border-2 border-border bg-background flex items-center justify-center mb-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400"></div>
                          </div>
                          <p className="text-sm font-medium">{format(new Date(project.startDate), "MMM d, yyyy")}</p>
                          <p className="text-xs font-semibold mt-1">Start Date</p>
                          <p className="text-xs text-muted-foreground mt-1">Project begins</p>
                        </div>
                        
                        {/* End Date */}
                        {project.endDate && (
                          <div className="flex flex-col items-center z-10">
                            <div className="w-8 h-8 rounded-full border-2 border-border bg-background flex items-center justify-center mb-2">
                              <div className="w-3 h-3 rounded-full bg-purple-500 dark:bg-purple-400"></div>
                            </div>
                            <p className="text-sm font-medium">{format(new Date(project.endDate), "MMM d, yyyy")}</p>
                            <p className="text-xs font-semibold mt-1">End Date</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Duration: {calculateDuration(new Date(project.startDate), new Date(project.endDate))}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Skeleton className="h-20 w-full" />
                  )}
                </div>
              </div>

              {/* Creator information */}
            {/*   <div className="space-y-4 pt-2">
                <div className="mb-2">
                  <h3 className="text-lg font-bold">Created By</h3>
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-32 font-bold">User</Label>
                  <div className="flex-1 py-2 px-3  ">
                    {creator ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 border">
                          {creator.image ? (
                            <AvatarImage src={creator.image} alt={creator.name || ''} />
                          ) : null}
                          <AvatarFallback>
                            {creator.email?.[0]?.toUpperCase() || creator.name?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{creator.name}</p>
                          <p className="text-sm text-muted-foreground">{creator.email}</p>
                        </div>
                      </div>
                    ) : (
                      <Skeleton className="h-8 w-full" />
                    )}
                  </div>
                </div>
              </div> */}
            </div>

            {/* Right column - Project description */}
            <div className="space-y-4">
              <div className="mb-2">
                <h3 className="text-lg font-bold">Project Description</h3>
                <p className="text-muted-foreground text-sm">
                  Detailed information about the project.
                </p>
              </div>
              
              <div className="border rounded-lg p-4 h-[1024px]">
                {projectContent ? (
                  <BlockPreview content={projectContent} />
                ) : (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-5/6" />
                    <Skeleton className="h-6 w-4/6" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-3/6" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </ContentLayout>
    </AdminPanelLayout>
  );
}


// Helper function to calculate duration between dates
const calculateDuration = (startDate: Date, endDate: Date) => {
  // Get exact difference in milliseconds
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // For short durations, just show days
  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  }
  
  // For durations less than a month, show weeks and days
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    const remainingDays = diffDays % 7;
    return `${weeks} week${weeks !== 1 ? 's' : ''}${remainingDays > 0 ? `, ${remainingDays} day${remainingDays !== 1 ? 's' : ''}` : ''}`;
  }
  
  // For longer durations, calculate months more precisely
  const monthDiff = (endDate.getMonth() + 12 * endDate.getFullYear()) - 
                    (startDate.getMonth() + 12 * startDate.getFullYear());
  
  // Calculate remaining days
  let tempDate = new Date(startDate);
  tempDate.setMonth(tempDate.getMonth() + monthDiff);
  
  // If we went too far, back up one month
  if (tempDate > endDate) {
    tempDate.setMonth(tempDate.getMonth() - 1);
    monthDiff - 1;
  }
  
  const remainingDays = Math.ceil((endDate.getTime() - tempDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate years and remaining months
  const years = Math.floor(monthDiff / 12);
  const months = monthDiff % 12;
  
  // Format the output based on the duration
  if (years > 0) {
    if (months > 0) {
      return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
    }
    return `${years} year${years !== 1 ? 's' : ''}`;
  }
  
  if (months > 0) {
    if (remainingDays > 0) {
      return `${months} month${months !== 1 ? 's' : ''}, ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
    }
    return `${months} month${months !== 1 ? 's' : ''}`;
  }
  
  // If we get here, it's just days
  return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
};