import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { Timeline } from "antd";
import { api } from "../../../../../../convex/_generated/api";

export const MyAssignedTasksActivity = () => {
  /* -------------------------------------------------- */
  /* 1 ▸ STATE FOR INFINITE SCROLL                      */
  /* -------------------------------------------------- */
  const [visibleCount, setVisibleCount] = useState(5);   // how many items to show
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  /* -------------------------------------------------- */
  /* 2 ▸ DATA FETCHING                                  */
  /* -------------------------------------------------- */
  const currentUser = useQuery(api.users.CurrentUser);

  const tasks = useQuery(
    api.queries.tasks.fetchAllTasksByAssignee,
    currentUser?._id ? { assigneeId: currentUser._id } : "skip"
  );

  const taskIds = tasks?.map((task) => task._id) ?? [];

  const activities = useQuery(
    api.queries.recentActivity.getActivitiesForUserTasks,
    taskIds.length ? { taskIds } : "skip"
  );

  const userIds = Array.from(
    new Set(activities?.map((a) => a.userId).filter(Boolean))
  );

  const users = useQuery(api.queries.users.getUsersByIds, { userIds });

  /* Map userId → name for fast lookup */
  const userMap = new Map(users?.map((u) => [u._id, u.name]));

  const isLoading = activities === undefined || users === undefined;

  /* -------------------------------------------------- */
  /* 3 ▸ INFINITE-SCROLL HANDLER                        */
  /* -------------------------------------------------- */
  useEffect(() => {
    const container = document.querySelector<HTMLElement>(
      ".my-tasks-activity-container"
    );
    if (!container || !activities) return;

    const handleScroll = () => {
      const { scrollTop, clientHeight, scrollHeight } = container;

      const nearBottom = scrollTop + clientHeight >= scrollHeight - 50;

      if (
        nearBottom &&
        !isLoadingMore &&
        visibleCount < activities.length
      ) {
        setIsLoadingMore(true);
        setTimeout(() => {
          setVisibleCount((prev) => prev + 5); // load 5 more items
          setIsLoadingMore(false);
        }, 500);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [activities, visibleCount, isLoadingMore]);

  /* -------------------------------------------------- */
  /* 4 ▸ RENDER                                         */
  /* -------------------------------------------------- */
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">Recent Activity on My Tasks</h3>
      </div>

      <div className="h-[300px] overflow-y-auto pr-2 activity-container my-tasks-activity-container scrollbar-hide">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <Timeline
              className="custom-timeline"
              items={activities
                ?.slice(0, visibleCount)
                .map((activity) => ({
                  children: (
                    <div className="text-foreground">
                      <p className="font-medium">
                        {userMap.get(activity.userId) || "Unknown User"}{" "}
                        {activity.actionType}
                      </p>
                      <p className="text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity._creationTime).toLocaleString()}
                      </p>
                    </div>
                  ),
                }))}
            />

            {isLoadingMore && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
