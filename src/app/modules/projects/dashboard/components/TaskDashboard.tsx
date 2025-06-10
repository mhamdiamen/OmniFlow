import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import TaskCheckBox from "./TaskCheckBox";
import TaskCard from "./TaskCard";
import { CalendarDisplay } from "./calendar/CalendarDisplay";

const overdueTasks = [
    { title: "Make a text campaign", date: "9 Aug" },
    { title: "Contact Jane Doe for reasons", date: "11 Aug" },
    { title: "Write new tasks", date: "11 Aug" },
]

const todayTasks = [
    {
        title: "Make a text campaign",
        description: "This is some description so the user doesn't forget",
    },
];
export default function TaskDashboard() {

    const [selectedTasks, setSelectedTasks] = useState<boolean[]>(Array(overdueTasks.length).fill(false))
    const [selectedToday, setSelectedToday] = useState<boolean[]>(Array(todayTasks.length).fill(false));

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

            {/* Middle Section - Left tall card, right two stacked cards */}
            <div className="grid grid-cols-3 gap-4">
                {/* Left: Tall Card (e.g., Daily Plan) */}
                <Card className="col-span-1 row-span-2 p-4 space-y-6">
                    <CardHeader className="flex flex-row justify-between items-center p-0">
                        <CardTitle className="text-lg">Tasks</CardTitle>
                        {/*                         <Button variant="outline" size="sm">+ Add task</Button>
 */}
                    </CardHeader>

                    <CardContent className="space-y-6 p-0 overflow-y-auto">
                        {/* Upcoming Section */}
                        <div className="space-y-2">
                            <h3 className="text-xs text-muted-foreground font-bold">Upcoming</h3>
                            <div className="space-y-2">
                                <TaskCard
                                    label="Make a text campaign"
                                    subLabel="Sublabel"
                                    description="This is some description so the user doesn't forget"
                                />
                                <TaskCard label="Make a text campaign" />
                                <Button variant="outline" size="sm" className="text-xs w-full">
                                    View 8 more
                                </Button>
                            </div>
                        </div>

                        {/* Overdue Section */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground font-bold">Overdue</span>
                                {isAnySelected && (
                                    <Button variant="secondary" size="sm" className="text-xs">
                                        Reschedule
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-2">
                                {overdueTasks.map((task, i) => (
                                    <TaskCheckBox
                                        key={i}
                                        label={task.title}
                                        subLabel={task.date}
                                        checked={selectedTasks[i]}
                                        onCheckedChange={(checked) => handleTaskChange(i, Boolean(checked))}
                                    />
                                ))}
                                <Button variant="outline" size="sm" className="text-xs w-full">
                                    View 3 more
                                </Button>
                            </div>
                        </div>

                        {/* Today Section */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1">
                                    <h3 className="text-xs text-muted-foreground font-bold">12 Aug</h3>
                                    <span className="text-xs text-muted-foreground font-medium">Today</span>
                                </div>
                                {isAnyTodaySelected && (
                                    <Button variant="secondary" size="sm" className="text-xs">
                                        Process Now
                                    </Button>
                                )}
                            </div>
                            <div className="space-y-2">
                                {todayTasks.map((task, i) => (
                                    <TaskCheckBox
                                        key={i}
                                        label={task.title}
                                        description={task.description}
                                        checked={selectedToday[i]}
                                        onCheckedChange={(checked) => handleTodayChange(i, Boolean(checked))}
                                    />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>



                {/* Right Top: Recent Activities */}
                <Card className="col-span-2 p-0">
                    <CardHeader>
                        <CardTitle className="text-lg">Your Calendar</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            Displays all dates on which you have assigned tasks.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="p-0 flex flex-col md:flex-row gap-6 items-center">

                            {/* Left: Headline, Description, Button */}
                            <div className="flex-1 flex flex-col justify-center space-y-2">
                                <h2 className="text-xl font-semibold">Maximize Your Productivity</h2>
                                <p className="text-sm text-muted-foreground">
                                    Stay on top of your schedule with a clear view of upcoming tasks and deadlines. Effortlessly manage your time and ensure nothing falls through the cracks.
                                </p>
                                <Button>View Scheduled Tasks</Button>
                            </div>

                            {/* Right: Calendar */}
                            <div className="flex-1 flex items-center justify-center">
                                <CalendarDisplay />
                            </div>

                        </div>
                    </CardContent>


                    <CardFooter className="text-xs text-muted-foreground justify-center text-center">
                        Dates marked with{'  '}
                        <span className="text-green-600 font-semibold">“O”</span>{' '}
                        indicate days containing one or more scheduled tasks.
                    </CardFooter>



                </Card>





                {/* Right Bottom: Recent Requests */}
                {/* Right Bottom: Recent Requests */}
                <Card className="col-span-1 p-0">
                    <CardHeader>
                        <CardTitle className="text-lg">Latest Comment Activities</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            See who commented, liked, or interacted with your posts in real-time.
                        </CardDescription>

                    </CardHeader>
                    <CardContent>
                        {/* Your content */}
                    </CardContent>
                </Card>

                <Card className="col-span-1 p-0">
                    <CardHeader>
                        <CardTitle className="text-lg">Your Calendar</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            Displays all dates on which you have assigned tasks.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Your content */}
                    </CardContent>
                </Card>

            </div>

        </div>
    );
}