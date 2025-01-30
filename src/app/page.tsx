"use client";

import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import CardPost from "@/components/Home/CardPost";
import { useQuery } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton"; // Add a skeleton loader
import { api } from "../../convex/_generated/api";
import { Card } from "@/components/ui/card";

export default function Home() {
  const me = useQuery(api.auth.getMe); // Ensure data is assigned correctly
  const currentUser = useQuery(api.users.CurrentUser);

  // Fetch stories from Convex
  const stories = useQuery(api.stories.getStories);

  // Check if the user is an admin
  const isAdmin = me?.role === "admin";
  const isReader = me?.role === "read";
  const isWriter = me?.role === "write";

  if (stories === undefined) {
    // Loading state
    return (
      <AdminPanelLayout>
        <ContentLayout title="Recent Stories">
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        </ContentLayout>
      </AdminPanelLayout>
    );
  }

  if (stories.length === 0) {
    // No stories found
    return (
      <AdminPanelLayout>
        <ContentLayout title="Recent Stories">
          <div className="mt-6">
            <p className="text-muted-foreground">No stories found.</p>
          </div>
        </ContentLayout>
      </AdminPanelLayout>
    );
  }

  return (

    <AdminPanelLayout>
      <ContentLayout title="Recent Stories">
        {/* Render the card only if the user is an admin */}
        {
          isAdmin && (
            <Card className="w-96 h-64 border rounded-lg shadow-lg flex justify-center items-center">
              Hello ya Admin
            </Card>
          )
        }

        {/* Render the card only if the user is a reader */}
        {
          isReader && (
            <Card className="w-96 h-64 border rounded-lg shadow-lg flex justify-center items-center">
              Hello ya Reader
            </Card>
          )
        }
        {isWriter && (
          <>
            <div>
              <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                Home
              </h3>
              <div className="leading-7">
                Overview of your activities and trends.
              </div>

              {/* Render the CardPost components in a grid */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {stories.map((story) => (
                  <CardPost
                    key={story._id}
                    user={story.user}
                    post={{
                      _id: story._id,
                      title: story.title,
                      status: story.status,
                      content: story.description || "No description available.",
                      hashtags: story.genre,
                      image: story.fileUrl || undefined,
                      createdAt: story.createdAt,
                    }}
                    engagement={{
                      likes: story.liked?.length || 0, // Ensure this is passed correctly
                      comments: 0, // Add comments count if available
                      shares: 0, // Add shares count if available
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}

      </ContentLayout>
    </AdminPanelLayout>
  );
}