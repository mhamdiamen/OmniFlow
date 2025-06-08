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

export interface Task {
    _id: string;
    name: string;
    description?: string;
    status: "todo" | "in_progress" | "completed" | "on_hold" | "canceled";
    priority: "low" | "medium" | "high" | "urgent";
    dueDate?: number;
    assigneeId?: string;
    assignee: User | null;  // Changed to allow null
    projectId?: string;
    projectDetails?: { _id: string; name: string } | null;

}


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