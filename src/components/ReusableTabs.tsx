import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Box, House, PanelsTopLeft } from "lucide-react";
import React from "react";

export interface TabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  badge?: string | number;
}

export interface ReusableTabsProps {
  items: TabItem[];
  defaultValue?: string;
  className?: string;
}

export function ReusableTabs({ items, defaultValue, className }: ReusableTabsProps) {
  return (
    <Tabs defaultValue={defaultValue || items[0].value} className={className}>
      <ScrollArea>
        <TabsList className="mb-3">
          {items.map((item) => (
            <TabsTrigger key={item.value} value={item.value} className="group">
              {item.icon && (
                <span className="-ms-0.5 me-1.5 opacity-60" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              {item.label}
              {item.badge && (
                <Badge
                  className="ms-1.5 min-w-5 px-1 transition-opacity group-data-[state=inactive]:opacity-50"
                  variant="secondary"
                >
                  {item.badge}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value}>
          <p className="p-4 pt-1 text-center text-xs text-muted-foreground">{item.content}</p>
        </TabsContent>
      ))}
    </Tabs>
  );
}
