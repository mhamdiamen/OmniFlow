import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import TaskCheckBox from "./TaskCheckBox";
import TaskCard from "./TaskCard";
import { CalendarDisplay } from "./calendar/CalendarDisplay";
import { MyAssignedTasksActivity } from "./MyAssignedTasksActivity";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { formatDate } from "@/lib/dateUtils";




export default function TaskDashboard() {
    const currentUser = useQuery(api.users.CurrentUser);

    const overdueTasks = useQuery(
        api.queries.tasks.fetchOverdueTasks,
        currentUser?._id ? { userId: currentUser._id } : "skip"
    );
    const upcomingTasks = useQuery(
        api.queries.tasks.fetchUpcomingTasks,
        currentUser?._id ? { userId: currentUser._id, daysAhead: 7 } : "skip"
    );
    const todayTasks = useQuery(
        api.queries.tasks.fetchTodaysTasks,
        currentUser?._id ? { userId: currentUser._id } : "skip"
    );

    const [selectedTasks, setSelectedTasks] = useState<boolean[]>([]);
    const [selectedToday, setSelectedToday] = useState<boolean[]>([]);
    const [showAllUpcoming, setShowAllUpcoming] = useState(false);
    const [showAllOverdue, setShowAllOverdue] = useState(false);
    const [showAllToday, setShowAllToday] = useState(false);

    const handleTaskChange = (index: number, checked: boolean) => {
        const updated = [...selectedTasks]
        updated[index] = checked
        setSelectedTasks(updated)
    }
    const handleTodayChange = (index: number, checked: boolean) => {
        const updated = [...selectedToday];
        updated[index] = checked;
        setSelectedToday(updated);
    };
    const isAnySelected = selectedTasks.some(Boolean)
    const isAnyTodaySelected = selectedToday.some(Boolean);



    React.useEffect(() => {
        if (overdueTasks) {
            setSelectedTasks(new Array(overdueTasks.length).fill(false));
        }
    }, [overdueTasks]);
    React.useEffect(() => {
        if (todayTasks) {
            setSelectedToday(new Array(todayTasks.length).fill(false));
        }
    }, [todayTasks]);

    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="p-4 h-24 flex items-center justify-between">

                    <div className="flex justify-between items-start">
                        <div>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>

                <Card className="p-4 h-24 flex items-center justify-between">

                    <div className="flex justify-between items-start">
                        <div>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>

                <Card className="p-4 h-24 flex items-center justify-between">

                    <div className="flex justify-between items-start">
                        <div>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>

                <Card className="p-4 h-24 flex items-center justify-between">

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

            {/* Middle Section - Left tall card, right two stacked cards */}
            <div className="grid grid-cols-12 gap-4">
                {/* Left: Tall Card */}
                <Card className="col-span-4 row-span-2 p-4 flex flex-col h-[600px] ">
                    <CardHeader className="flex flex-row justify-between items-center p-0 pb-4"> {/* Added padding-bottom */}
                        <CardTitle className="text-lg">Tasks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 p-4 overflow-y-auto flex-1"> {/* Added flex-1 */}
                        {/* Upcoming Section */}
                        <div className="space-y-2">
                            <h3 className="text-xs text-muted-foreground font-bold">Upcoming</h3>
                            <div className="space-y-2">
                                {upcomingTasks === undefined ? (
                                    <p className="text-xs text-muted-foreground">Loading...</p>
                                ) : upcomingTasks.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No upcoming tasks 🎉</p>
                                ) : (
                                    <>
                                        {(showAllUpcoming ? upcomingTasks : upcomingTasks.slice(0, 2)).map((task) => (
                                            <TaskCard
                                                key={task._id}
                                                label={task.name}
                                                subLabel={task.projectDetails?.name}
                                                description={task.description}
                                            />
                                        ))}
                                        {upcomingTasks.length > 2 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs w-full"
                                                onClick={() => setShowAllUpcoming((prev) => !prev)}
                                            >
                                                {showAllUpcoming
                                                    ? "Show Less"
                                                    : `View ${upcomingTasks.length - 2} more`}
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Overdue Section */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground font-bold">Overdue</span>
                                {isAnySelected && <Button variant="secondary" size="sm" className="text-xs">Reschedule</Button>}
                            </div>
                            <div className="space-y-2">
                                {overdueTasks === undefined ? (
                                    <p className="text-xs text-muted-foreground">Loading...</p>
                                ) : overdueTasks.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No overdue tasks</p>
                                ) : (
                                    <>
                                        {(showAllOverdue ? overdueTasks : overdueTasks.slice(0, 2)).map((task, i) => ( // Changed from 3 to 2
                                            <TaskCheckBox
                                                key={task._id}
                                                label={task.name}
                                                prefixLabel={task.projectDetails?.name}
                                                subLabel={task.dueDate ? `${formatDate(task.dueDate)}` : "No due date"}
                                                subLabelClassName="text-red-500"
                                                description={task.description}
                                                checked={selectedTasks[i]}
                                                onCheckedChange={(checked) => handleTaskChange(i, Boolean(checked))}
                                            />
                                        ))}
                                        {overdueTasks.length > 2 && ( // Changed from 3 to 2
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs w-full"
                                                onClick={() => setShowAllOverdue((prev) => !prev)}
                                            >
                                                {showAllOverdue
                                                    ? "Show Less"
                                                    : `View ${overdueTasks.length - 2} more`} {/* Changed from 3 to 2 */}
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                        {/* Today Section */}

                        {/* Today Section */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1">
                                    <h3 className="text-xs text-muted-foreground font-bold">
                                        {formatDate(new Date().getTime())}
                                    </h3>
                                    <span className="text-xs text-muted-foreground font-medium">Today</span>
                                </div>
                                {isAnyTodaySelected && (
                                    <Button variant="secondary" size="sm" className="text-xs">
                                        Process Now
                                    </Button>
                                )}
                            </div>
                            <div className="space-y-2">
                                {todayTasks === undefined ? (
                                    <p className="text-xs text-muted-foreground">Loading...</p>
                                ) : todayTasks.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No tasks for today</p>
                                ) : (
                                    <>
                                        {(showAllToday ? todayTasks : todayTasks.slice(0, 2)).map((task, i) => (
                                            <TaskCheckBox
                                                key={task._id}
                                                label={task.name}
                                                prefixLabel={task.projectDetails?.name}
                                                /* subLabel={task.dueDate ? formatDate(task.dueDate) : "No due date"} */
                                                description={task.description}
                                                checked={selectedToday[i]}
                                                onCheckedChange={(checked) => handleTodayChange(i, Boolean(checked))}
                                            />
                                        ))}
                                        {todayTasks.length > 2 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs w-full"
                                                onClick={() => setShowAllToday((prev) => !prev)}
                                            >
                                                {showAllToday
                                                    ? "Show Less"
                                                    : `View ${todayTasks.length - 2} more`}
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                    </CardContent>
                </Card>

                {/* Right: Calendar Card */}
                <Card className="col-span-8 p-0  h-[600px] row-span-2"> {/* Match same height */}
                    <CardHeader>
                        <CardTitle className="text-lg">Calendar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 flex flex-col md:flex-row gap-4 items-center">
                            <div className="flex-1 flex flex-col justify-center space-y-4">
                                <h2 className="text-xl font-semibold">Maximize Your Productivity</h2>
                                <p className="text-sm text-muted-foreground">Stay on top of your schedule with a clear view of upcoming tasks and deadlines. Effortlessly manage your time and ensure nothing falls through the cracks.</p>
                                <Button>View Scheduled Tasks</Button>
                            </div>
                            <div className="flex-1 flex items-center justify-center">
                                <CalendarDisplay />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="text-xs text-muted-foreground justify-center text-center font-bold">
                        Dates marked with{' '}<span className="text-green-600 font-bold">“O”</span>{' '}indicate days containing one or more scheduled tasks.
                    </CardFooter>
                </Card>

                {/* Bottom: Three Cards */}
                <div className="grid grid-cols-3 gap-4 col-span-12">
                    <Card className="p-0">
                        <CardHeader>
                            <CardTitle className="text-lg">Notifications</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">You have 3 unread notifications.</CardDescription>
                        </CardHeader>
                        <CardContent>{/* Future content */}</CardContent>
                    </Card>


                    <Card className="p-0">
                        <CardHeader>
                            <CardTitle className="text-lg">Your Calendar</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">Displays all dates on which you have assigned tasks.</CardDescription>
                        </CardHeader>
                        <CardContent>{/* Your content */}</CardContent>
                    </Card>
                    <Card className="p-0">
                        <CardHeader>
                            <CardTitle className="text-lg">Latest Comment Activities</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">See who commented, liked, or interacted with your posts in real-time.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <MyAssignedTasksActivity />
                        </CardContent>
                    </Card>

                </div>
            </div>


        </div>
    );
}