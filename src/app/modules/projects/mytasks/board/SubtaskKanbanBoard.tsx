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
import { Subtask, SubtaskDragData } from "@/types/types";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ModulesManagement/components/ReusableEmptyState";
import { SubtaskCard } from "./SubTaskCard";
import { useTimer } from "@/components/Time/TimerProvider";

const statusColumns = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "completed", title: "Completed" },
  { id: "on_hold", title: "On Hold" },
  { id: "canceled", title: "Canceled" },
];

export function SubtaskKanbanBoard({ projectId }: { projectId: string }) {
  // 1. First, state hooks
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<Id<"subtasks"> | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [columns] = useState<Column[]>(statusColumns);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeSubtask, setActiveSubtask] = useState<Subtask | null>(null);

  // 2. Timer context
  const { startTimer } = useTimer();

  // 3. Then, context/ID hooks
  const dndContextId = useId();

  // 4. Then, Convex data hooks
  const currentUser = useQuery(api.users.CurrentUser);
  const updateSubtaskStatus = useMutation(api.mutations.tasks.updateSubtaskStatus);
  const updateSubtaskPosition = useMutation(api.mutations.tasks.updateSubtaskPosition);

  const userSubtasks = useQuery(
    api.queries.tasks.fetchSubtasksByAssigneeAndProject,
    currentUser?._id && projectId
      ? {
        assigneeId: currentUser._id as Id<"users">,
        projectId: projectId as Id<"projects">,
      }
      : "skip"
  );

  // 5. Then, other hooks (useMemo, useCallback, useSensors)
  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  const handleSubtaskClick = useCallback((subtaskId: string) => {
    setSelectedSubtaskId(subtaskId as Id<"subtasks">);
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
    data: DataRef<SubtaskDragData | ColumnDragData>;
  } => {
    if (!entry) {
      return false;
    }

    const data = entry.data.current;

    if (data?.type === "Column" || data?.type === "Subtask") {
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

    if (data?.type === "Subtask") {
      setActiveSubtask(data.subtask);
      return;
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveColumn(null);
    setActiveSubtask(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (!hasDraggableData(active)) return;

    const activeData = active.data.current;

    if (activeId === overId) return;

    if (activeData?.type === "Subtask") {
      const validStatuses = ["todo", "in_progress", "completed", "on_hold", "canceled"] as const;
      type ValidStatus = typeof validStatuses[number];

      const newColumnId = hasDraggableData(over)
        ? over.data.current?.type === "Column"
          ? over.id as string
          : over.data.current?.subtask.status
        : over.id as string;

      const oldColumnId = activeData.subtask.status;

      if (
        typeof newColumnId === "string" &&
        validStatuses.includes(newColumnId as ValidStatus) &&
        oldColumnId !== newColumnId
      ) {
        const status = newColumnId as ValidStatus;

        // Optimistically update the local subtask's status
        activeData.subtask.status = status;

        try {
          await updateSubtaskStatus({
            subtaskId: activeId as Id<"subtasks">,
            status,
          });

          console.log("Subtask status updated");

          // If subtask moved to in_progress, start the timer
          if (status === "in_progress") {
            const timerSubtask = {
              id: activeData.subtask._id,
              title: activeData.subtask.label, // Use 'label' instead of 'title'
              description: undefined, // Not available in subtask schema
              status: status,
              priority: activeData.subtask.parentTask?.priority as "low" | "medium" | "high" | "urgent" | undefined,
              progress: activeData.subtask.parentTask?.progress, // Get from parent task
              type: activeData.subtask.parentTask?.name ? `Task: ${activeData.subtask.parentTask.name}` : 'Subtask',
              parentTask: activeData.subtask.parentTask ? {
                name: activeData.subtask.parentTask.name, // Use 'name' instead of 'title'
                projectId: activeData.subtask.parentTask.projectId,
              } : undefined,
              projectDetails: activeData.subtask.projectDetails ? {
                name: activeData.subtask.projectDetails.name, // Use 'name' instead of 'title'
              } : undefined,
            };

            startTimer(timerSubtask);
          }

        } catch (error) {
          console.error("Failed to update subtask status:", error);
          // Rollback if update fails
          activeData.subtask.status = oldColumnId;
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

    const isActiveASubtask = activeData?.type === "Subtask";
    const isOverASubtask = overData?.type === "Subtask";

    if (!isActiveASubtask) return;

    if (isActiveASubtask && isOverASubtask) {
      // Handle subtask reordering within the same column if needed
      const activeSubtask = activeData.subtask;
      const overSubtask = overData.subtask;

      if (activeSubtask.status === overSubtask.status) {
        // Same column reordering logic could be implemented here
        // You might want to update positions based on the drop location
      }
    }

    const isOverAColumn = overData?.type === "Column";

    if (isActiveASubtask && isOverAColumn) {
      // The status change will be handled in onDragEnd
    }
  };

  if (!currentUser || !userSubtasks) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (userSubtasks.length === 0) {
    return (
      <div className="flex justify-center items-center py-10">
        <EmptyState
          title="No subtasks assigned to you"
          description="You don't have any subtasks assigned in this project."
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
                  items={userSubtasks.filter((subtask: Subtask) => subtask.status === column.id)}
                  onItemClick={handleSubtaskClick}
                  ItemComponent={SubtaskCard}
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
                  items={userSubtasks.filter((subtask: Subtask) => subtask.status === activeColumn.id)}
                  ItemComponent={SubtaskCard}
                  isOverlay
                />
              )}
              {activeSubtask && <SubtaskCard subtask={activeSubtask} isOverlay />}
            </DragOverlay>,
            document.body
          )}
      </DndContext>

      {/* Add ViewSubtaskSheet component */}
      {/*  <ViewSubtaskSheet
        subtaskId={selectedSubtaskId}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      /> */}
    </>
  );
}