'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useQuery } from 'convex/react';


import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { api } from '../../../../../convex/_generated/api';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ModulesManagement/components/ReusableEmptyState';
import { Id } from '../../../../../convex/_generated/dataModel';

interface ProjectTasksListProps {
    projectId: string;
    
}

export function ProjectTasksList({ projectId }: ProjectTasksListProps) {
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(6);

    const projectTasks = useQuery(
        api.queries.tasks.fetchTasksByProject,
        projectId ? { projectId: projectId as Id<"projects"> } : "skip"
    );
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

    if (!projectTasks) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        );
    }

    if (projectTasks.length === 0) {
        return (
            <div className="flex justify-center items-center py-10">
                <EmptyState
                    title="No tasks yet"
                    description="Get started by creating a new task for this project."
                    imageSrc="/chapters-empty.png"
                />
            </div>
        );
    }

    const pageCount = Math.ceil(projectTasks.length / pageSize);
    const startIndex = pageIndex * pageSize;
    const endIndex = Math.min(startIndex + pageSize, projectTasks.length);
    const paginatedTasks = projectTasks.slice(startIndex, endIndex);

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedTasks.map((task) => (
                    <div key={task._id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-lg">{task.name}</h4>
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
                                {task.assigneeDetails ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6 border">
                                            {task.assigneeDetails.image ? (
                                                <AvatarImage
                                                    src={task.assigneeDetails.image}
                                                    alt={task.assigneeDetails.name || task.assigneeDetails.email}
                                                />
                                            ) : null}
                                            <AvatarFallback>
                                                {task.assigneeDetails.email?.[0]?.toUpperCase() ||
                                                    task.assigneeDetails.name?.[0]?.toUpperCase() ||
                                                    '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">
                                            {task.assigneeDetails.name || task.assigneeDetails.email}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">Unassigned</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 flex flex-col items-center justify-between gap-4 text-sm">
                <div className="text-muted-foreground">
                    Showing {startIndex + 1} to {endIndex} of {projectTasks.length} tasks
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <div className="flex items-center space-x-2">
                        <p className="font-medium">Rows per page</p>
                        <Select
                            value={`${pageSize}`}
                            onValueChange={(value) => {
                                setPageSize(Number(value));
                                setPageIndex(0);
                            }}
                        >
                            <SelectTrigger className="h-8 w-[4.5rem]">
                                <SelectValue placeholder={`${pageSize}`} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[6, 9, 12, 15, 18].map((size) => (
                                    <SelectItem key={size} value={`${size}`}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="font-medium">Page {pageIndex + 1} of {pageCount || 1}</div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="icon" className="size-8" onClick={() => setPageIndex(0)} disabled={pageIndex === 0}>
                            <ChevronsLeft className="size-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="size-8" onClick={() => setPageIndex(Math.max(0, pageIndex - 1))} disabled={pageIndex === 0}>
                            <ChevronLeft className="size-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="size-8" onClick={() => setPageIndex(Math.min(pageCount - 1, pageIndex + 1))} disabled={pageIndex >= pageCount - 1}>
                            <ChevronRight className="size-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="size-8" onClick={() => setPageIndex(pageCount - 1)} disabled={pageIndex >= pageCount - 1}>
                            <ChevronsRight className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
