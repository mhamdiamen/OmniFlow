import { UniqueIdentifier } from "@dnd-kit/core";
import { Id } from "../../../../../../convex/_generated/dataModel";
export type CalendarView = "month" | "week" | "day" | "agenda"

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  allDay?: boolean
  color?: EventColor
  location?: string
}

export type EventColor =
  | "sky"
  | "amber"
  | "violet"
  | "rose"
  | "emerald"
  | "orange"




export interface Subtask {
  _id: Id<"subtasks">;
  _creationTime: number;
  taskId: Id<"tasks">;
  label: string;
  status: "todo" | "in_progress" | "completed" | "on_hold" | "canceled";
  createdAt: number;
  completedAt?: number;
  createdBy: Id<"users">;
  completedBy?: Id<"users">;
  position: number;
  // Extended fields from queries
  parentTask?: Task | null;
  projectDetails?: Project | null;
  assigneeDetails?: User | null;
}

export interface Task {
  _id: Id<"tasks">;
  _creationTime: number;
  projectId: Id<"projects">;
  name: string;
  description?: string;
  assigneeId?: Id<"users">;
  status: "todo" | "in_progress" | "completed" | "on_hold" | "canceled";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: number;
  createdBy: Id<"users">;
  completedAt?: number;
  completedBy?: Id<"users">;
  progress?: number;
}

export interface Project {
  _id: Id<"projects">;
  _creationTime: number;
  name: string;
  description?: string;
  companyId: Id<"companies">;
  teamId?: Id<"teams">;
  projectId?: Id<"projects">;
  status: "planned" | "in_progress" | "completed" | "on_hold" | "canceled";
  tags?: string[];
  category?: string;
  healthStatus?: "on_track" | "at_risk" | "off_track";
  priority?: "low" | "medium" | "high" | "critical";
  progress?: number;
  completedTasks?: number;
  totalTasks?: number;
  startDate: number;
  endDate?: number;
  createdBy: Id<"users">;
  updatedBy?: Id<"users">;
  updatedAt?: number;
}

export interface User {
  _id: Id<"users">;
  _creationTime: number;
  // Add other user fields as needed
  name?: string;
  email?: string;
  avatar?: string;
}

export type SubtaskDragData = {
  type: "Subtask";
  subtask: Subtask;
};

export type ColumnDragData = {
  type: "Column";
  column: Column;
};

export interface Column {
  id: string;
  title: string;
}