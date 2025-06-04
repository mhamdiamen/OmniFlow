"use client";

import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { UserTasksList } from "../components/UserTasksList";
import { KanbanBoard } from "./board/KanbanBoard";

export default function MyTasksPage() {
  return (
    <AdminPanelLayout>
      <ContentLayout title="My Tasks">
        <KanbanBoard />

        <UserTasksList />
      </ContentLayout>
    </AdminPanelLayout>
  );
}
