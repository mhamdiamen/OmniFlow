"use client";

import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Card } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { EmptyState } from "@/components/StoryManagement/components/ReusableEmptyState";
import { ChaptersTable } from "@/components/ChapterManagement/ChaptersTable";
import { AddChapter } from "@/components/ChapterManagement/CRUD/AddChapter";
import { EnrichedChapter } from "@/types"; // Use the shared type from types.ts
import { Loader } from "lucide-react";

export default function Chapters() {
  const me = useQuery(api.auth.getMe); // Ensure data is assigned correctly
  const currentUser = useQuery(api.users.CurrentUser);
  const userChapters = useQuery(api.chapters.getEnrichedChapters) || [];

  // Check if the user is an admin
  const isAdmin = me?.role === "admin";
  const isReader = me?.role === "read";
  const isWriter = me?.role === "write";

  return (
    <AdminPanelLayout>
      <ContentLayout title="My Chapters">
        {/* Render the card only if the user is an admin */}
        {isAdmin && (
          <Card className="w-96 h-64 border rounded-lg shadow-lg flex justify-center items-center">
            Hello ya Admin
          </Card>
        )}

        {/* Render the card only if the user is a reader */}
        {isReader && (
          <Card className="w-96 h-64 border rounded-lg shadow-lg flex justify-center items-center">
            Hello ya Reader
          </Card>
        )}

        {/* Render the card only if the user is a writer */}
        {isWriter && (
          <>
            <div className="flex items-center justify-between">
              {/* Title */}
              <div className="mt-5 max-w-4xl text-left">
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                  {currentUser?.name}'s Chapters
                </h1>
                <p className="mt-2 text-md text-muted-foreground">
                  Create, manage, and shape your stories while engaging with your audience.
                </p>
              </div>
              {/* End Title */}
              <AddChapter />
            </div>
            <div className="mt-6">
              {userChapters ? (
                <ChaptersTable chapters={userChapters as EnrichedChapter[]} />
              ) : (
                <EmptyState
                  title="No Chapters Yet"
                  description="Create your first chapter to start building your story. It's quick and easy!"
                  imageSrc="/img/reflecting.png"
                  actionComponent={<AddChapter />}
                />
              )}
            </div>
          </>
        )}

        {/* Show spinner if the user does not have the required role */}
        {!isAdmin && !isReader && !isWriter && (
          <div className="flex justify-center items-center h-[50vh]">
            <Loader className="w-12 h-12 animate-spin text-gray-500" />
          </div>
        )}
      </ContentLayout>
    </AdminPanelLayout>
  );
}
