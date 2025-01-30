"use client";

import React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip } from "recharts";

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
import { TrendingUp } from "lucide-react";

interface Story {
    genre: string[];
    chapterCount: number; // Strictly typed as number
}

interface AverageChaptersLineChartProps {
    stories: Story[];
}

export function AverageChaptersLineChart({
    stories,
}: AverageChaptersLineChartProps) {
    // Aggregate data for average chapters per genre
    const genreStats = stories.reduce((acc, story) => {
        story.genre.forEach((genre) => {
            if (!acc[genre]) acc[genre] = { totalChapters: 0, storyCount: 0 };
            acc[genre].totalChapters += story.chapterCount;
            acc[genre].storyCount++;
        });
        return acc;
    }, {} as Record<string, { totalChapters: number; storyCount: number }>);

    const chartData = Object.entries(genreStats).map(([genre, stats]) => ({
        genre,
        averageChapters: stats.totalChapters / stats.storyCount,
    }));

    // Find the genre with the highest average chapters
    const dominantGenre = chartData.reduce(
        (max, genre) =>
            genre.averageChapters > max.averageChapters ? genre : max,
        { genre: "", averageChapters: 0 }
    ).genre;

    const chartConfig = {
        averageChapters: {
            label: "Average ",
            color: "hsl(var(--chart-1))",
        },
    } satisfies ChartConfig;

    return (
        <Card>
            <CardHeader className="items-center pb-4">
                <CardTitle>Average Chapters Per Genre</CardTitle>
                <CardDescription>
                    Explore the average chapter distribution across genres.
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-1">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto w-full max-h-52"
                >
                    <LineChart
                        data={chartData}
                        margin={{
                            left: 0,
                            right: 50,
                            top: 20,
                            bottom: 20,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="genre"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            interval={0}
                        />
                        <YAxis
                            allowDecimals={false}
                            label={{
                                angle: -90,
                                position: "insideLeft",
                            }}
                        />
                        <Tooltip content={<ChartTooltipContent hideLabel />} />
                        <Line
                            dataKey="averageChapters"
                            type="monotone"
                            stroke="hsl(var(--chart-1))"
                            strokeWidth={2}
                            dot={{ fill: "hsl(var(--chart-1))" }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 font-medium leading-none">
                    The genre with the highest average chapters is{" "}
                    {dominantGenre} <TrendingUp className="h-4 w-4" />. 
                </div>
                <div className="flex items-center gap-2 leading-none text-muted-foreground">
                    Chapter Distribution Overview
                </div>
            </CardFooter>
        </Card>
    );
}
