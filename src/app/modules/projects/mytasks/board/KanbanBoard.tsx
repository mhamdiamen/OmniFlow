import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from 'convex/react';

import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  useSensor,
  useSensors,
  KeyboardSensor,
  TouchSensor,
  MouseSensor,
  Active,
  Over,
  DataRef,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { Column, BoardColumn, BoardContainer, ColumnDragData } from "./BoardColumn";
import { coordinateGetter } from "./multipleContainersKeyboardPreset";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../convex/_generated/api";
import { Task, TaskDragData } from "@/types/types";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ModulesManagement/components/ReusableEmptyState";
import { TaskCard } from "./TaskCard";
import { ViewTaskSheet } from "../../tasks/components/ViewTaskSheet";

const statusColumns = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "completed", title: "Completed" },
  { id: "on_hold", title: "On Hold" },
  { id: "canceled", title: "Canceled" },
];

export function KanbanBoard({ projectId }: { projectId: string }) {

  // 1. First, state hooks
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [columns] = useState<Column[]>(statusColumns);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // 2. Then, context/ID hooks
  const dndContextId = useId();

  // 3. Then, Convex data hooks
  const currentUser = useQuery(api.users.CurrentUser);
  const updateTaskStatus = useMutation(api.mutations.tasks.updateTaskStatus);
  const userTasks = useQuery(
    api.queries.tasks.fetchTasksByAssignee,
    currentUser?._id && projectId
      ? {
        assigneeId: currentUser._id as Id<"users">,
        projectId: projectId as Id<"projects">,
      }
      : "skip"
  );

  // 4. Then, other hooks (useMemo, useCallback, useSensors)
  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);





  const handleTaskClick = useCallback((taskId: string) => {
    setSelectedTaskId(taskId as Id<"tasks">);
    setIsSheetOpen(true);
  }, []);


  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // Require 5px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms delay before drag starts
        tolerance: 5, // 5px movement tolerance
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: coordinateGetter,
    })
  );

  const hasDraggableData = <T extends Active | Over>(
    entry: T | null | undefined
  ): entry is T & {
    data: DataRef<TaskDragData | ColumnDragData>;
  } => {
    if (!entry) {
      return false;
    }

    const data = entry.data.current;

    if (data?.type === "Column" || data?.type === "Task") {
      return true;
    }

    return false;
  };


  const onDragStart = (event: DragStartEvent) => {
    if (!hasDraggableData(event.active)) return;
    const data = event.active.data.current;
    if (data?.type === "Column") {
      setActiveColumn(data.column);
      return;
    }

    if (data?.type === "Task") {
      setActiveTask(data.task);
      return;
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (!hasDraggableData(active)) return;

    const activeData = active.data.current;

    if (activeId === overId) return;

    if (activeData?.type === "Task") {
      const validStatuses = ["todo", "in_progress", "completed", "on_hold", "canceled"] as const;
      type ValidStatus = typeof validStatuses[number];

      const newColumnId = hasDraggableData(over)
        ? over.data.current?.type === "Column"
          ? over.id as string
          : over.data.current?.task.status
        : over.id as string;

      const oldColumnId = activeData.task.status;

      if (
        typeof newColumnId === "string" &&
        validStatuses.includes(newColumnId as ValidStatus) &&
        oldColumnId !== newColumnId
      ) {
        const status = newColumnId as ValidStatus;

        // Optimistically update the local task's status
        activeData.task.status = status;

        try {
          await updateTaskStatus({
            taskId: activeId as Id<"tasks">,
            status,
          });
          console.log("Task status updated");
        } catch (error) {
          console.error("Failed to update task status:", error);
          // Rollback if update fails
          activeData.task.status = oldColumnId;
        }
      }
    }
  };



  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    if (!hasDraggableData(active) || !hasDraggableData(over)) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    const isActiveATask = activeData?.type === "Task";
    const isOverATask = overData?.type === "Task";

    if (!isActiveATask) return;

    if (isActiveATask && isOverATask) {
      // You can implement task reordering within the same column if needed
    }

    const isOverAColumn = overData?.type === "Column";

    if (isActiveATask && isOverAColumn) {
      // The status change will be handled in onDragEnd
    }
  };

  if (!currentUser || !userTasks) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (userTasks.length === 0) {
    return (
      <div className="flex justify-center items-center py-10">
        <EmptyState
          title="No tasks assigned to you"
          description="You don't have any tasks assigned to this project."
          imageSrc="/chapters-empty.png"
        />
      </div>
    );
  }


  return (
    <>

      <DndContext
        id={dndContextId}
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        {/* Add a scrollable container */}
        <div className="w-full pb-2">
          <BoardContainer>
            <SortableContext items={columnsId}>
              {columns.map((column) => (
                <BoardColumn
                  key={column.id}
                  column={column}
                  tasks={userTasks.filter(task => task.status === column.id)}
                  onTaskClick={handleTaskClick} // Pass the click handler

                />
              ))}
            </SortableContext>
          </BoardContainer>
        </div>

        {typeof window !== "undefined" &&
          createPortal(
            <DragOverlay>
              {activeColumn && (
                <BoardColumn
                  column={activeColumn}
                  tasks={userTasks.filter(task => task.status === activeColumn.id)}
                  isOverlay
                />
              )}
              {activeTask && <TaskCard task={activeTask} isOverlay />}
            </DragOverlay>,
            document.body
          )}
      </DndContext>

      {/* Add ViewTaskSheet component */}
      <ViewTaskSheet
        taskId={selectedTaskId}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </>

  );
}