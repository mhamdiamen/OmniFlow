"use client";

import { TrendingUp } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

interface Story {
    status: string;
}

interface StoryStatusChartProps {
    stories: Story[];
}

export function StoryStatusChart({ stories }: StoryStatusChartProps) {
    // Aggregate status data
    const statusCounts = stories.reduce((acc, story) => {
        acc[story.status] = (acc[story.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Prepare chart data
    const chartData = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
    }));

    // Find the dominant status
    const dominantStatus = Object.entries(statusCounts).reduce(
        (max, [status, count]) => (count > max.count ? { status, count } : max),
        { status: "", count: 0 }
    ).status;

    const chartConfig = {
        status: {
            label: "Status",
            color: "hsl(var(--chart-1))", // Apply consistent color for visualization
        },
    } satisfies ChartConfig;

    return (
        <Card>
            <CardHeader className="items-center pb-4">
                <CardTitle>Track Your Story Status</CardTitle>
                <CardDescription>Visualize the status distribution of your stories in one glance.</CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto  max-h-[350px]"
                >
                    <RadarChart data={chartData}>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <PolarAngleAxis dataKey="status" />
                        <PolarGrid />
                        <Radar
                            dataKey="count"
                            fill="hsl(var(--chart-1))"
                            fillOpacity={0.6}
                        />
                    </RadarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 font-medium leading-none">
                    Most of your stories are {dominantStatus} <TrendingUp className="h-4 w-4" />. Keep up the momentum!
                </div>
                <div className="flex items-center gap-2 leading-none text-muted-foreground">
                    Status Overview
                </div>
            </CardFooter>
        </Card>
    );
}
