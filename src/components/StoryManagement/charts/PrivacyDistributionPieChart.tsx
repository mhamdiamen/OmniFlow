"use client";

import { TrendingUp } from "lucide-react";
import { LabelList, Pie, PieChart } from "recharts";

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

interface PrivacyDistributionPieChartProps {
  stories: { privacy: string }[];
}

export function PrivacyDistributionPieChart({ stories }: PrivacyDistributionPieChartProps) {
  // Aggregate privacy data
  const privacyCounts = stories.reduce((acc, story) => {
    acc[story.privacy] = (acc[story.privacy] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Prepare chart data
  const chartData = Object.entries(privacyCounts).map(([privacy, count], index) => ({
    privacy,
    count,
    fill: `hsl(var(--chart-${(index % 5) + 1}))`, // Cycle through provided colors
  }));

  const chartConfig = {
    privacy: { label: "Count" },
  } satisfies ChartConfig;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Privacy Distribution</CardTitle>
        <CardDescription>Analyze privacy settings for your stories</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px] [&_.recharts-text]:fill-background"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="privacy" hideLabel />}
            />
            <Pie data={chartData} dataKey="count">
              <LabelList
                dataKey="privacy"
                className="fill-background"
                stroke="none"
                fontSize={12}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Distribution Overview <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Based on active story privacy settings.
        </div>
      </CardFooter>
    </Card>
  );
}
