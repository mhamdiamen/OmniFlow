"use client";

import * as React from "react";
import { Pie, PieChart, Sector, Label } from "recharts";

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
    ChartStyle,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Story {
    genre: string[];
}

interface GenreDistributionChartProps {
    stories: Story[];
}

export function GenreDistributionChart({ stories }: GenreDistributionChartProps) {
    // Aggregate genre data
    const genreCounts = stories.reduce((acc, story) => {
        story.genre.forEach((genre) => {
            acc[genre] = (acc[genre] || 0) + 1;
        });
        return acc;
    }, {} as Record<string, number>);

    // Prepare chart data
    const chartData = Object.entries(genreCounts).map(([genre, count], index) => ({
        genre,
        count,
        fill: `hsl(var(--chart-${(index % 5) + 1}))`, // Cycle through the provided colors
    }));

    // Configuration for dropdown and active state
    const [activeGenre, setActiveGenre] = React.useState(chartData[0]?.genre || "");
    const activeIndex = React.useMemo(
        () => chartData.findIndex((item) => item.genre === activeGenre),
        [activeGenre, chartData]
    );
    const genres = React.useMemo(() => chartData.map((item) => item.genre), [chartData]);

    const chartConfig = {
        genre: { label: "Genre" },
    } satisfies ChartConfig;

    return (
        <Card data-chart="genre-distribution" className="flex flex-col">
            <ChartStyle id="genre-distribution" config={chartConfig} />
            <CardHeader className="flex-row items-start space-y-0 pb-0">
                <div className="grid gap-1">
                    <CardTitle>Interactive Genre Distribution</CardTitle>
                    <CardDescription>Explore the genres of your active stories.
                    </CardDescription>
                </div>
                <Select value={activeGenre} onValueChange={setActiveGenre}>
                    <SelectTrigger
                        className="ml-auto h-7 w-[130px] rounded-lg pl-2.5"
                        aria-label="Select genre"
                    >
                        <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent align="end" className="rounded-xl">
                        {genres.map((genre) => (
                            <SelectItem
                                key={genre}
                                value={genre}
                                className="rounded-lg [&_span]:flex"
                            >
                                <div className="flex items-center gap-2 text-xs">
                                    <span
                                        className="flex h-3 w-3 shrink-0 rounded-sm"
                                        style={{
                                            backgroundColor: `hsl(var(--chart-${(genres.indexOf(genre) % 5) + 1}))`,
                                        }}
                                    />
                                    {genre}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="flex flex-1 justify-center pb-0">
                <ChartContainer
                    id="genre-distribution"
                    config={chartConfig}
                    className="mx-auto  max-h-[300px]   "
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="count"
                            nameKey="genre"
                            innerRadius={60}
                            strokeWidth={5}
                            activeIndex={activeIndex}
                            activeShape={({ outerRadius = 0, ...props }) => (
                                <g>
                                    <Sector {...props} outerRadius={outerRadius + 10} />
                                    <Sector
                                        {...props}
                                        outerRadius={outerRadius + 25}
                                        innerRadius={outerRadius + 12}
                                    />
                                </g>
                            )}
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-foreground text-3xl font-bold"
                                                >
                                                    {chartData[activeIndex]?.count || 0}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className="fill-muted-foreground"
                                                >
                                                    Stories
                                                </tspan>
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 font-medium leading-none">
                    Current Genre Overview
                </div>
                <div className="leading-none text-muted-foreground">
                    View and interact with the genre breakdown of your connected stories in real time.

                </div>
            </CardFooter>
        </Card>
    );
}
