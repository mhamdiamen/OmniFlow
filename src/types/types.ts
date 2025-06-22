import { UniqueIdentifier } from "@dnd-kit/core";
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




export interface User {
    _id: string;
    _creationTime?: number;
    name?: string;
    email?: string;
    image?: string;
    emailVerificationTime?: number;
    phone?: string;
    // Include other user fields if needed
}
export type Subtask = {
    id: string;
    label: string;
    completed: boolean;
    createdAt?: number; // float64 from Convex
    completedAt?: number; // float64 from Convex
  };
  
export type Task = {
  _id: string;
  name: string;
  description?: string | null;

  status: "todo" | "in_progress" | "completed" | "on_hold" | "canceled";
  priority: "low" | "medium" | "high" | "urgent";

  dueDate?: number | null; // float64
  assigneeId?: string | null;
  assignee?: User | null;  // Changed to allow null

  projectId: string; // required in schema
  projectDetails: { _id: string; name: string } | null;

  createdBy: string; // userId
  completedAt?: number | null;
  completedBy?: string | null;

  subtasks?: Subtask[]; // embedded array of subtasks
  progress?: number | null; // 0–100 derived from subtasks
};


export interface Column {
    id: UniqueIdentifier;
    title: string;
}

export type ColumnType = "Column";
export type TaskType = "Task";

export type ColumnDragData = {
    type: ColumnType;
    column: Column;
};

export type TaskDragData = {
    type: TaskType;
    task: Task;
};