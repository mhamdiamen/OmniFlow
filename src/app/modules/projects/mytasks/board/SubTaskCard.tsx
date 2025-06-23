// SubtaskCard.tsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare, FileText } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Subtask } from "@/types/types";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";

interface SubtaskCardProps {
    subtask: Subtask;
    isOverlay?: boolean;
    onClick?: (subtaskId: string) => void;
}

export const SubtaskCard = ({ subtask, isOverlay, onClick }: SubtaskCardProps) => {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: subtask._id,
        data: {
            type: "Subtask",
            subtask,
        },
    });

    // Fetch comments count for this subtask (if comments system applies to subtasks)
    const comments = useQuery(api.queries.comments.getCommentsByTarget, {
        targetId: subtask._id,
        targetType: "subtask", // Assuming comments can be on subtasks
    });

    // Calculate total comments (parent comments + all replies)
    const totalComments = comments?.reduce((total, comment) => {
        return total + 1 + (comment.replyCount || 0);
    }, 0) || 0;

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Only trigger if not currently dragging
        if (!isDragging && onClick) {
            onClick(subtask._id);
        }
    };

    const renderSubtaskStatusBadge = (status: string) => {
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

    const renderParentTaskInfo = () => {
        if (!subtask.parentTask) return null;

        const priorityColors: Record<string, string> = {
            low: 'bg-blue-400',
            medium: 'bg-yellow-400',
            high: 'bg-orange-400',
            urgent: 'bg-red-500',
        };

        return (
            <div className="flex items-center gap-2 mb-2 p-2 bg-muted/30 rounded text-xs">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground truncate">{subtask.parentTask.name}</span>
                <Badge className="text-[9px] px-1 py-0.5 flex items-center gap-1 rounded">
                    <div className={`w-1.5 h-1.5 rounded-full ${priorityColors[subtask.parentTask.priority] || 'bg-gray-400'}`} />
                    <span>{subtask.parentTask.priority}</span>
                </Badge>
            </div>
        );
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`border rounded-lg p-3 hover:bg-accent/50 transition-colors ${
                isOverlay ? "ring-2 ring-primary" : ""
            } ${isDragging ? "opacity-50" : "opacity-100"}`}
            onClick={handleClick}
        >
            {/* Parent Task Info */}
            {renderParentTaskInfo()}

            {/* Subtask Header */}
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm leading-tight">{subtask.label}</h4>
                {subtask.projectDetails && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0.5">
                        {subtask.projectDetails.name}
                    </Badge>
                )}
            </div>

            {/* Status Badge */}
            <div className="flex gap-2 mb-2">
                {renderSubtaskStatusBadge(subtask.status)}
            </div>

            {/* Footer with metadata */}
            <div className="flex justify-between items-center mt-3 pt-2 border-t border-border/30">
                {/* Due date from parent task */}
                {subtask.parentTask?.dueDate && (
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span
                            className={`text-[10px] ${
                                subtask.parentTask.dueDate < Date.now() && subtask.status !== 'completed'
                                    ? 'text-red-500 font-medium'
                                    : 'text-muted-foreground'
                            }`}
                        >
                            {format(new Date(subtask.parentTask.dueDate), 'MMM d')}
                            {subtask.parentTask.dueDate < Date.now() && subtask.status !== 'completed' && ' (!)'}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    {/* Comments count */}
                    {totalComments > 0 && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            <span className="text-[10px]">{totalComments}</span>
                        </div>
                    )}

                    {/* Assignee avatar */}
                    {subtask.assigneeDetails && (
                        <Avatar className="h-5 w-5">
                            <AvatarImage src={subtask.assigneeDetails.avatar} />
                            <AvatarFallback className="text-[8px]">
                                {subtask.assigneeDetails.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                        </Avatar>
                    )}
                </div>
            </div>

            {/* Completion timestamp for completed subtasks */}
            {subtask.status === 'completed' && subtask.completedAt && (
                <div className="text-[9px] text-muted-foreground mt-1 text-right">
                    Completed {format(new Date(subtask.completedAt), 'MMM d, HH:mm')}
                </div>
            )}
        </div>
    );
};