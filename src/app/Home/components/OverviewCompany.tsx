import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Timeline } from 'antd';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { useState } from "react";
export default function OverviewCompany() {
    const currentUser = useQuery(api.users.CurrentUser);
    const userCompany = useQuery(api.queries.company.getCompanyByOwner);
    const recentActivities = useQuery(api.queries.recentActivity.getActivitiesByCompany, {
        companyId: userCompany?._id || "",
    });

    // Fetch user details for each activity
    const users = useQuery(api.queries.users.getUsersByIds, {
        userIds: recentActivities?.map(activity => activity.userId) || []
    });

    // Create a map of user IDs to user names
    const userMap = new Map(users?.map(user => [user._id, user.name]));

    // Add this filter function outside of the JSX return
    // Add these state variables at the top of the component
    const [visibleCount, setVisibleCount] = useState(5);

    // Modify the filter function to include pagination
    // Replace the existing filter function with this date-based one
    // Enhance the filter function with better date handling
    const filterActivitiesByTime = (activities: any[], period: string) => {
        if (!activities) return [];

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        return activities.filter((activity) => {
            const activityDate = new Date(activity._creationTime);
            const activityDay = new Date(
                activityDate.getFullYear(),
                activityDate.getMonth(),
                activityDate.getDate()
            );

            switch (period) {
                case 'today':
                    // Activities from today (same day)
                    return activityDay.getTime() === today.getTime();
                case 'yesterday':
                    // Activities from yesterday (day before today)
                    return activityDay.getTime() === yesterday.getTime();
                case 'week':
                    // Activities from last week (excluding today and yesterday)
                    return activityDay.getTime() < yesterday.getTime() &&
                        activityDay.getTime() >= lastWeek.getTime();
                default:
                    return true;
            }
        });
    };
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    React.useEffect(() => {
        const handleScroll = () => {
            const container = document.querySelector('.activity-container');
            if (container && recentActivities) {
                const { scrollTop, scrollHeight, clientHeight } = container;
                const currentTab = document.querySelector('.tabs-content[data-state="active"]')?.getAttribute('data-value');
                const filteredActivities = currentTab ? filterActivitiesByTime(recentActivities, currentTab) : recentActivities;

                if (scrollTop + clientHeight >= scrollHeight - 50 &&
                    !isLoadingMore &&
                    visibleCount < filteredActivities.length) {
                    setIsLoadingMore(true);
                    setTimeout(() => {
                        setVisibleCount(prev => prev + 5);
                        setIsLoadingMore(false);
                    }, 500);
                }
            }
        };

        const container = document.querySelector('.activity-container');
        container?.addEventListener('scroll', handleScroll);

        return () => {
            container?.removeEventListener('scroll', handleScroll);
        };
    }, [isLoadingMore, visibleCount, recentActivities]);

    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                          
                        </div>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>

                {/* Recent Activities Card */}

            </div>

            {/* Second Row */}
            <div className="grid grid-cols-2 gap-4">
                {/* Daily plan */}
                <Card className="p-4">
                
                </Card>
                {/* Recent Activities */}
                <Card className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold">Recent Activities</h3>

                    </div>
                    <Tabs defaultValue="today" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-4">
                            <TabsTrigger value="today">Today</TabsTrigger>
                            <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
                            <TabsTrigger value="week">Last Week</TabsTrigger>
                            <TabsTrigger value="all">All</TabsTrigger>
                        </TabsList>




                        <div className="h-[300px] overflow-y-auto pr-2 activity-container scrollbar-hide">
                            <TabsContent value="today">
                                <Timeline className="custom-timeline"
                                    items={filterActivitiesByTime(recentActivities || [], 'today').slice(0, visibleCount).map((activity) => ({
                                        children: (
                                            <div className="text-foreground">
                                                <p className="font-medium">{userMap.get(activity.userId) || 'Unknown User'} {activity.actionType}</p>
                                                <p className="text-muted-foreground">{activity.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(activity._creationTime).toLocaleString()}
                                                </p>
                                            </div>
                                        ),
                                    }))}
                                />
                            </TabsContent>

                            <TabsContent value="yesterday">
                                <Timeline className="custom-timeline"
                                    items={filterActivitiesByTime(recentActivities || [], 'yesterday').slice(0, visibleCount).map((activity) => ({
                                        children: (
                                            <div className="text-foreground">
                                                <p className="font-medium">{userMap.get(activity.userId) || 'Unknown User'} {activity.actionType}</p>
                                                <p className="text-muted-foreground">{activity.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(activity._creationTime).toLocaleString()}
                                                </p>
                                            </div>
                                        ),
                                    }))}
                                />
                          
                            </TabsContent>

                            <TabsContent value="week">
                                <Timeline className="custom-timeline"
                                    items={filterActivitiesByTime(recentActivities || [], 'week').slice(0, visibleCount).map((activity) => ({
                                        children: (
                                            <div className="text-foreground">
                                                <p className="font-medium">{userMap.get(activity.userId) || 'Unknown User'} {activity.actionType}</p>
                                                <p className="text-muted-foreground">{activity.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(activity._creationTime).toLocaleString()}
                                                </p>
                                            </div>
                                        ),
                                    }))}
                                />
                             
                            </TabsContent>

                            <TabsContent value="all">
                                <Timeline className="custom-timeline"
                                    items={(recentActivities || []).slice(0, visibleCount).map((activity) => ({
                                        children: (
                                            <div className="text-foreground">
                                                <p className="font-medium">{userMap.get(activity.userId) || 'Unknown User'} {activity.actionType}</p>
                                                <p className="text-muted-foreground">{activity.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(activity._creationTime).toLocaleString()}
                                                </p>
                                            </div>
                                        ),
                                    }))}
                                />
                            </TabsContent>

                            {isLoadingMore && (
                                <div className="flex justify-center py-4">
                                    <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    </Tabs>
                    {!recentActivities?.length && (
                        <p className="text-xs text-muted-foreground">No recent activities</p>
                    )}
                </Card>


            </div>

            {/* Third Row */}
            <div className="grid grid-cols-2 gap-4">
                {/* Available trucks */}
                <Card className="p-4">
                 
                </Card>

                {/* Recent requests */}
                <Card className="p-4">
                 
                </Card>
            </div>
        </div>
    );
}