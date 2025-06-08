"use client";

import { useEffect, useState, use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import BlockPreview from "@/components/BlockPreview";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ArrowLeft, Calendar, CheckCircle, AlertTriangle, XCircle, Users, FileIcon, ClipboardList, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus, Smile, Paperclip, Loader } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import React from "react";
import { Testimonial } from "@/components/ui/testimonial";
import { Timeline } from 'antd';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCurrentUser } from "@/app/api/use-current-user";
import { CommentsTab } from "../components/CommentsTab";
import { EmptyState } from "@/components/ModulesManagement/components/ReusableEmptyState";
import { ProjectTasksList } from "../components/ProjectTasksList";


export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  // Use `use` to unwrap params for future compatibility
  const unwrappedParams = use(params as any); // Temporarily cast to `any` to avoid TypeScript errors
  const projectId = (unwrappedParams as { id: string }).id as Id<"projects">;
  const [visibleCount, setVisibleCount] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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

  // Replace the existing activities query with this:
  const activities = useQuery(api.queries.recentActivity.getActivitiesByTargetType, {
    targetType: "project",
    targetId: projectId // Add the project ID as targetId
  });
  // Fetch user details for each activity
  const users = useQuery(api.queries.users.getUsersByIds, {
    userIds: activities?.map(activity => activity.userId) || []
  });
  const userMap = new Map(users?.map(user => [user._id, user.name]));

  // Load project content when project data is available
  useEffect(() => {
    if (project?.description) {
      setProjectContent(project.description);
    }
  }, [project]);
  React.useEffect(() => {
    const handleScroll = () => {
      const container = document.querySelector('.activity-container');
      if (container && activities) {
        const { scrollTop, scrollHeight, clientHeight } = container;

        if (scrollTop + clientHeight >= scrollHeight - 50 &&
          !isLoadingMore &&
          visibleCount < activities.length) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount(prev => prev + 5);
            setIsLoadingMore(false);
          }, 500);
        }
      }
    };

    const container = document.querySelector('.activity-container');
    container?.addEventListener('scroll', handleScroll);

    return () => {
      container?.removeEventListener('scroll', handleScroll);
    };
  }, [isLoadingMore, visibleCount, activities]);
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
      "planned": "bg-blue-100 text-blue-800 border-blue-200",
      "in_progress": "bg-green-100 text-green-800 border-green-200",
      "completed": "bg-purple-100 text-purple-800 border-purple-200",
      "on_hold": "bg-amber-100 text-amber-800 border-amber-200",
      "canceled": "bg-red-100 text-red-800 border-red-200"
    };

    const statusLabels: Record<string, string> = {
      "planned": "Planned",
      "in_progress": "In Progress",
      "completed": "Completed",
      "on_hold": "On Hold",
      "canceled": "Canceled"
    };

    return (
      <Badge variant="outline" className={`${status ? statusColors[status] : "bg-gray-100 text-gray-800 border-gray-200"}`}>
        {status ? statusLabels[status] : "Unknown"}
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

  const { data, isLoading } = useCurrentUser();

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

        <div className="w-full space-y-4 ml-0 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Left column - Project details */}
            <div className="space-y-6 border rounded-lg p-4">
              {/* Basic Information Section */}
              <div className="space-y-4 ">

                <div className="mb-2">
                  <h3 className="text-lg font-bold">Project Details</h3>
                  <p className="text-muted-foreground text-sm">
                    Basic information about the project.
                  </p>
                </div>
                {/* Project Name */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-4xl font-bold">
                        {project ? project.name : <Skeleton className="h-12 w-full" />}
                      </h2>
                      {project ? (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">|</span>
                          <span className="font-bold">{project.category || "No category"}</span>
                        </div>
                      ) : <Skeleton className="h-5 w-24" />}
                    </div>
                  </div>

                  {/* Tags moved under project name */}
                  <div className="mt-3">
                    {project ? (
                      project.tags && project.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {project.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              className="text-[10px] leading-tight px-1 py-0.5 rounded text-center min-w-[20px] text-nowrap"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : <span className="text-muted-foreground text-sm">No tags</span>
                    ) : <Skeleton className="h-5 w-full" />}
                  </div>
                </div>


                {/* Team */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    {team ? (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-semibold"></h4>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            <span>{team.members?.length || 0} members</span>
                          </Badge>
                        </div>

                        <Testimonial
                          className="py-6"
                          quote={team.description || `${team.name} is a collaborative team working together to achieve great results.`}
                          authorName={team.name}
                          authorPosition={`Created on ${team._creationTime ? format(new Date(team._creationTime), "MMM d, yyyy") : "N/A"}`}
                          highlightedText={team.name}
                          teamMembers={team.memberDetails}
                        />

                        {/* Team Members Avatars are now displayed in the Testimonial component */}
                      </div>
                    ) : project?.teamId ? (
                      <Skeleton className="h-24 w-full" />
                    ) : (
                      "No team assigned"
                    )}
                  </div>
                </div>





              </div>

              {/* Project Status Section */}
              <div className="pt-2">
                <div className="mb-2">
                  <h3 className="text-lg font-bold">Project Status</h3>
                  <p className="text-muted-foreground text-sm">
                    Current state and importance of the project.
                  </p>
                </div>


                {/* Status */}
                <div className="flex items-center gap-4">
                  <Label className="w-32 ">Status</Label>
                  <div className="flex items-center py-2 px-3">
                    {project ? renderStatusBadge(project.status) : <Skeleton className="h-5 w-full" />}
                  </div>
                </div>

                {/* Priority */}
                <div className="flex items-center gap-4">
                  <Label className="w-32 ">Priority</Label>
                  <div className="flex items-center py-2 px-3">
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
              <div className="space-y-4 pt-2 ">
                <div className="mb-2">
                  <h3 className="text-lg font-bold">Timeline</h3>
                  <p className="text-muted-foreground text-sm">
                    Project duration and dates.
                  </p>
                </div>

                {/* Custom Timeline Implementation */}
                <div className="mt-4 px-2 ">
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

              <div className="border rounded-lg p-4 h-[865px] overflow-y-auto scrollbar-hide">
                <div className="mb-2">
                  <h3 className="text-lg font-bold">Project Description</h3>
                  <p className="text-muted-foreground text-sm">
                    Detailed information about the project.
                  </p>
                </div>

                {projectContent ? (
                  <div className="h-[865px]">
                    <BlockPreview content={projectContent} />
                  </div>

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
          {/* Recent Activities Section */}
          <div className="space-y-4 pt-2 border rounded-lg p-4">
            <div className="mb-2">
              <h3 className="text-lg font-bold">Project Insights</h3>
              <p className="text-muted-foreground text-sm">
                Dive into tasks, track recent updates, and join the conversation — all in one place.
              </p>
            </div>


            {/* Tabs for Tasks, Recent Activity, Attachments, and Comments */}
            <Tabs defaultValue="recentActivity" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="recentActivity">Recent Activity</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
              </TabsList>

              {/* Tab Content: Tasks */}
              <TabsContent value="tasks">
                <Card className="p-4">
                  <ProjectTasksList projectId={projectId} />
                </Card>
              </TabsContent>

              {/* Tab Content: Recent Activity */}
              <TabsContent value="recentActivity">
                <Card className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold">Recent Activity</h3>
                  </div>
                  <div className="h-[300px] overflow-y-auto pr-2 activity-container scrollbar-hide">


                    <Timeline className="custom-timeline"
                      items={activities?.slice(0, visibleCount).map((activity) => ({
                        children: (
                          <div className="text-foreground">
                            <p className="font-medium">{userMap.get(activity.userId) || 'Unknown User'} {activity.actionType}</p>
                            <p className="text-muted-foreground">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity._creationTime).toLocaleString()}
                            </p>
                          </div>
                        ),
                      }))}
                    />
                    {isLoadingMore && (
                      <div className="flex justify-center py-4">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>


              {/* Tab Content: Comments */}
              <CommentsTab targetId={projectId} targetType="project" />

            </Tabs>
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