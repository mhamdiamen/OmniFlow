"use client";

import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import Timer from "@/components/tracker";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Subtask, Task } from "@/types/types";
// 🔽 Import types from your shared types file

export default function TaskTimersPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const currentUser = useQuery(api.users.CurrentUser);

    const fetchedTasks = useQuery(
        api.queries.tasks.fetchAllTasksByAssignee,
        currentUser?._id
            ? {
                assigneeId: currentUser._id as Id<"users">,
            }
            : "skip"
    );

    useEffect(() => {
        if (fetchedTasks) {
            setTasks(fetchedTasks);
        }
    }, [fetchedTasks]);

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Subtask Timers</h2>

            {tasks.length === 0 ? (
                <p>No tasks found.</p>
            ) : (
                tasks.map((task: Task) => (
                    <div key={task._id} className="mb-6 border-b pb-4">
                        <h3 className="text-lg font-semibold">{task.name}</h3>

                        {task.subtasks && task.subtasks.length > 0 ? (
                            task.subtasks.map((subtask: Subtask) => (
                                <div key={subtask.id} className="ml-4 mt-2">
                                    <p className="text-sm text-gray-700">{subtask.label}</p>
                                    <Timer key={subtask.id} subjectId={subtask.id} />
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 ml-4">No subtasks</p>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}