import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { useDndContext, type UniqueIdentifier } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMemo } from "react";
import { cva } from "class-variance-authority";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Subtask } from "@/types/types";
import { FilePlus } from "lucide-react";

export interface Column {
  id: UniqueIdentifier;
  title: string;
}

export type ColumnType = "Column";

export type ColumnDragData = {
  type: ColumnType;
  column: Column;
}

// Define the props that your ItemComponent should receive
interface ItemComponentProps {
  subtask: Subtask;
  onClick?: (subtaskId: string) => void;
  isOverlay?: boolean;
}

interface BoardColumnProps {
  column: Column;
  items: Subtask[];
  isOverlay?: boolean;
  onItemClick?: (subtaskId: string) => void;
  ItemComponent: React.ComponentType<ItemComponentProps>; // Properly typed component
}

export const BoardColumn = ({ 
  column, 
  items, 
  isOverlay, 
  onItemClick,
  ItemComponent 
}: BoardColumnProps) => {
  const itemIds = useMemo(() => {
    return items.map((item) => item._id);
  }, [items]);

  const { setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column
    } satisfies ColumnDragData,
    attributes: {
      roleDescription: `Column: ${column.title}`
    }
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform)
  };

  const variants = cva(
    " max-w-[300px] bg-primary-foreground flex flex-col flex-shrink-0 overflow-y-auto",
    {
      variants: {
        dragging: {
          default: "border-2 border-transparent",
          over: "ring-2 opacity-30",
          overlay: "ring-2 ring-primary",
          active: "bg-accent/20 border-dashed border-primary"
        }
      }
    }
  );

  // Define column header colors based on column ID
  const getColumnHeaderColor = (columnId: string) => {
    const colorMap: Record<string, string> = {
      todo: 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
      in_progress: 'bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800',
      completed: 'bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800',
      on_hold: 'bg-yellow-100 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-800',
      canceled: 'bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800'
    };

    return colorMap[columnId] || 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  };

  const headerColorClass = getColumnHeaderColor(column.id.toString());

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={variants({
        dragging: isOverlay
          ? "overlay"
          : isDragging
            ? "over"
            : isOver
              ? "active"
              : undefined,
      })}>
      <CardHeader className={`p-4 font-semibold border-b-2 ${headerColorClass} flex flex-row items-center justify-between`}>
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-base">{column.title}</h1>
          <Badge className="h-5 w-5 flex items-center justify-center p-0">
            {items.length}
          </Badge>
        </div>
      </CardHeader>
      <ScrollArea>
        <CardContent className="flex flex-grow flex-col gap-2 p-2">
          <SortableContext items={itemIds}>
            {items.length === 0 ? (
              <div className="flex flex-grow flex-col items-center justify-center text-center rounded-xl border border-dashed border-gray-500 p-6 ">
                <FilePlus className="h-10 w-10 mb-3 text-gray-500" />
                <p className="text-sm font-medium text-gray-500">No subtasks yet</p>
                <p className="text-xs text-gray-400">Start by dragging subtasks here.</p>
              </div>
            ) : (
              items.map((item) => (
                <ItemComponent
                  key={item._id}
                  subtask={item}
                  onClick={onItemClick}
                />
              ))
            )}
          </SortableContext>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}

export const BoardContainer = ({ children }: { children: React.ReactNode }) => {
  const dndContext = useDndContext();

  const variations = cva("px-2 md:px-0 flex pb-4 w-full", {
    variants: {
      dragging: {
        default: "snap-x snap-mandatory",
        active: "snap-none",
      },
    },
  });

  return (
    <div className="w-full overflow-x-auto">
      <ScrollArea className={variations({ dragging: dndContext.active ? "active" : "default" })}>
        <div className="flex gap-4 items-start">
          {children}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};