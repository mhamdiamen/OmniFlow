"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { TasksTable } from "./components/TasksTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useState } from "react";
import { CreateTaskSheet } from "./components/CreateTaskSheet";

export default function TasksPage() {
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  
  // First, get the current user to access their company ID
  const currentUserQuery = useQuery(api.users.CurrentUser);
  
  // Get all tasks for the current user's company
  const tasksQuery = useQuery(
    api.queries.tasks.fetchAllTasks,
    currentUserQuery?.companyId as Id<"companies">
      ? { companyId: currentUserQuery?.companyId as Id<"companies"> }
      : "skip"
  );

  const tasks = tasksQuery || [];

  return (
    <AdminPanelLayout>
      <ContentLayout title="Tasks">
        <div className="flex justify-between items-center mb-4">
          <div>
            {/* Page description or other content can go here */}
          </div>
       
        </div>
        <TasksTable tasks={tasks} />
        
        {/* Create Task Sheet */}
        <CreateTaskSheet 
          open={createTaskOpen} 
          onOpenChange={setCreateTaskOpen} 
        />
      </ContentLayout>
    </AdminPanelLayout>
  );
}
