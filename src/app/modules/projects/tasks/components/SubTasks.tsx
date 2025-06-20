// Subtasks.tsx
import { CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/dateUtils";

interface Subtask {
    id: string;
    label: string;
    completed: boolean;
    completedAt?: number;
}

interface Props {
    taskId: string;
    subtasks: Subtask[];
    onToggleSubtask: (taskId: string, subtaskId: string) => void;
}

export const Subtasks = ({ taskId, subtasks, onToggleSubtask }: Props) => {
    const completedCount = subtasks.filter(subtask => subtask.completed).length;
    const totalCount = subtasks.length;
    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold">Subtasks</h3>
                   
                </div>
 {/* Circular progress with count to the right */}
 {totalCount > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="relative w-8 h-8">
                                <svg className="w-full h-full" viewBox="0 0 36 36">
                                    {/* Background circle */}
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="15.9155"
                                        fill="none"
                                        className="stroke-muted-foreground/20"
                                        strokeWidth="2"
                                    />
                                    {/* Progress circle */}
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="15.9155"
                                        fill="none"
                                        className="stroke-green-500"
                                        strokeWidth="2"
                                        strokeDasharray={`${progressPercentage} 100`}
                                        strokeLinecap="round"
                                        transform="rotate(-90 18 18)"
                                    />
                                </svg>
                            </div>
                            <span className="text-sm font-medium">
                                {completedCount}/{totalCount}
                            </span>
                        </div>
                    )}

            </div>

            <div className="space-y-3">
                {subtasks.map((subtask) => {
                    const isCompleted = subtask.completed;

                    return (
                        <Card
                            key={subtask.id}
                            className={`
                flex items-center justify-between p-4 transition-all
                ${isCompleted ?
                                    'bg-muted/30 border-muted-foreground/20 text-muted-foreground' :
                                    'hover:bg-muted/50'
                                }
              `}
                        >
                            <div className="flex items-center gap-4 w-full">
                                {/* Toggle Button */}
                                <button
                                    type="button"
                                    onClick={() => onToggleSubtask(taskId, subtask.id)}
                                    className={`
                    flex-shrink-0 rounded-full p-1 transition-colors
                    ${isCompleted ?
                                            'text-green-500 hover:text-green-600' :
                                            'text-muted-foreground hover:text-foreground hover:bg-muted'
                                        }
                  `}
                                    aria-label={isCompleted ? "Mark as incomplete" : "Mark as complete"}
                                >
                                    {isCompleted ? (
                                        <CheckCircle2 className="h-5 w-5" />
                                    ) : (
                                        <div className="h-5 w-5 border-2 rounded-full border-current" />
                                    )}
                                </button>

                                {/* Subtask Label */}
                                <p className={`
                  font-medium flex-1
                  ${isCompleted ? 'line-through' : ''}
                `}>
                                    {subtask.label}
                                </p>

                                {/* Completion Date - aligned to right */}
                                {/* Completion Date - aligned to right */}
                                {isCompleted && subtask.completedAt && (
                                    <p className="text-xs text-muted-foreground/80 whitespace-nowrap ml-4">
                                        {formatDate(subtask.completedAt)}
                                    </p>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};