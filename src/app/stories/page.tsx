"use client";

import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Card } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AddStory } from "@/components/StoryManagement/CRUD/AddStory";
import { StoriesTable } from "@/components/StoryManagement/StoriesTable";
import { EmptyState } from "@/components/StoryManagement/components/ReusableEmptyState";
import { GenreDistributionChart } from "@/components/StoryManagement/charts/GenreDistributionChart";
import { StoryStatusChart } from "@/components/StoryManagement/charts/StoryStatusChart";
import { AverageChaptersLineChart } from "@/components/StoryManagement/charts/AverageChaptersLineChart";
import { PrivacyDistributionPieChart } from "@/components/StoryManagement/charts/PrivacyDistributionPieChart";
import { Loader } from "lucide-react";

export default function Stories() {
  const me = useQuery(api.auth.getMe);
  const currentUser = useQuery(api.users.CurrentUser);
  const userStories = useQuery(api.stories.getCurrentUserStories);

  const isAdmin = me?.role === "admin";
  const isReader = me?.role === "read";
  const isWriter = me?.role === "write";

  const processedStories = userStories
    ? userStories.map((story) => ({
        ...story,
        chapterCount: story.chapterCount ?? 0,
        privacy: story.isPrivate ? "Private" : "Public",
      }))
    : [];

  return (
    <AdminPanelLayout>
      <ContentLayout title="My Stories">
        {/* Render the card only if the user is an admin */}
        {isAdmin && (
          <Card className="w-full md:w-96 h-64 border rounded-lg shadow-lg flex justify-center items-center">
            Hello ya Admin
          </Card>
        )}

        {/* Render the card only if the user is a reader */}
        {isReader && (
          <Card className="w-full md:w-96 h-64 border rounded-lg shadow-lg flex justify-center items-center">
            Hello ya Reader
          </Card>
        )}

        {/* Render the card only if the user is a writer */}
        {isWriter && (
          <>
            <div className="flex flex-col md:flex-row items-center justify-between">
              {/* Title */}
              <div className="mt-5 max-w-4xl text-center md:text-left">
                <h1 className="scroll-m-20 text-3xl md:text-4xl font-extrabold tracking-tight lg:text-5xl">
                  {currentUser?.name}'s Stories
                </h1>
                <p className="mt-2 text-sm md:text-md text-muted-foreground">
                  Create, manage, and shape your stories while engaging with your audience.
                </p>
              </div>
              {/* End Title */}
              <div className="mt-4 md:mt-0">
                <AddStory />
              </div>
            </div>
            <div className="mt-6">
              {userStories ? (
                <>
                  {/* Charts container with flex layout */}
                  <div className="flex flex-wrap gap-4 justify-center">
                    <GenreDistributionChart stories={processedStories} />
                    <PrivacyDistributionPieChart stories={processedStories} />
                    <StoryStatusChart stories={processedStories} />


                  </div>
                  <div className="mt-4">
                    <AverageChaptersLineChart stories={processedStories} />
                  </div>

                  {/* Stories table */}
                  <div className="mt-4 overflow-x-auto">
                    <StoriesTable stories={userStories} />
                  </div>
                </>
              ) : (
                <EmptyState
                  title="No Stories Yet"
                  description="Begin your creative journey by adding a new story today!"
                  imageSrc="/img/reflecting.png"
                  actionComponent={<AddStory />}
                />
              )}
            </div>
          </>
        )}

        {/* Optionally, you can add a message if the user is not an admin, reader, or writer */}
        {!isAdmin && !isReader && !isWriter && (
          <div className="flex justify-center items-center h-[50vh]">
            <Loader className="w-12 h-12 animate-spin text-gray-500" />
          </div>
        )}
      </ContentLayout>
    </AdminPanelLayout>
  );
}