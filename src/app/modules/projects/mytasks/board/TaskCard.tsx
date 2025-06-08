// TaskCard.tsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Task } from "@/types/types";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";

interface TaskCardProps {
    task: Task;
    isOverlay?: boolean;
    onClick?: (taskId: string) => void; // Add onClick prop

}

export const TaskCard = ({ task, isOverlay, onClick }: TaskCardProps) => {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task._id,
        data: {
            type: "Task",
            task,
        },
    });
    // Fetch comments count for this task
    const comments = useQuery(api.queries.comments.getCommentsByTarget, {
        targetId: task._id,
        targetType: "task",
    });

    // Calculate total comments (parent comments + all replies)
    const totalComments = comments?.reduce((total, comment) => {
        return total + 1 + (comment.replyCount || 0); // 1 for parent comment + replyCount
    }, 0) || 0;

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    // TaskCard.tsx
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Only trigger if not currently dragging
        if (!isDragging && onClick) {
            onClick(task._id);
        }
    };
    const renderTaskStatusBadge = (status: string) => {
        const statusColors: Record<string, string> = {
            todo: 'bg-gray-500',
            in_progress: 'bg-blue-500',
            completed: 'bg-green-500',
            on_hold: 'bg-yellow-500',
            canceled: 'bg-red-500',
        };

        const statusLabels: Record<string, string> = {
            todo: 'To Do',
            in_progress: 'In Progress',
            completed: 'Completed',
            on_hold: 'On Hold',
            canceled: 'Canceled',
        };

        return (
            <Badge className="text-[10px] px-1 py-0.5 flex items-center gap-2 rounded">
                <div className={`w-2 h-2 rounded-full ${statusColors[status] || 'bg-gray-500'}`} />
                <span>{statusLabels[status] || status}</span>
            </Badge>
        );
    };

    const renderTaskPriorityBadge = (priority: string) => {
        const priorityColors: Record<string, string> = {
            low: 'bg-blue-400',
            medium: 'bg-yellow-400',
            high: 'bg-orange-400',
            urgent: 'bg-red-500',
        };

        const priorityLabels: Record<string, string> = {
            low: 'Low',
            medium: 'Medium',
            high: 'High',
            urgent: 'Urgent',
        };

        return (
            <Badge className="text-[10px] px-1 py-0.5 flex items-center gap-2 rounded">
                <div className={`w-2 h-2 rounded-full ${priorityColors[priority] || 'bg-gray-400'}`} />
                <span>{priorityLabels[priority] || priority}</span>
            </Badge>
        );
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`border rounded-lg p-4 hover:bg-accent/50 transition-colors ${isOverlay ? "ring-2 ring-primary" : ""
                } ${isDragging ? "opacity-50" : "opacity-100"}`}
            onClick={handleClick} // Add onClick handler

        >
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-lg">{task.name}</h4>
                {/* {task.projectDetails && (
                    <Badge variant="outline" className="text-xs">
                        {task.projectDetails.name}
                    </Badge>
                )} */}
            </div>
            <div className="flex gap-2 mb-2">
                {renderTaskStatusBadge(task.status)}
                {renderTaskPriorityBadge(task.priority)}
            </div>
            {task.description && (
                <p className="text-muted-foreground mb-3 text-sm">
                    {task.description.length > 150
                        ? `${task.description.substring(0, 150)}...`
                        : task.description}
                </p>
            )}
            <div className="flex justify-between items-center mt-2">
                {task.dueDate && (
                    <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span
                            className={`text-xs ${task.dueDate < Date.now() && task.status !== 'completed'
                                ? 'text-red-500 font-medium'
                                : 'text-muted-foreground'
                                }`}
                        >
                            {format(new Date(task.dueDate), 'MMM d, yyyy')}
                            {task.dueDate < Date.now() && task.status !== 'completed' && ' (Overdue)'}
                        </span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    {totalComments > 0 && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-xs">{totalComments}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

};