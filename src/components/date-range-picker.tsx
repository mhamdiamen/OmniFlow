"use client";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
  disablePastDates?: boolean;
  disableWeekends?: boolean;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
  placeholder = "Select date range",
  disablePastDates = true,
  disableWeekends = false
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  
  // Build disabled dates array based on props
  const disabledDates = useMemo(() => {
    const dates = [];
    
    if (disablePastDates) {
      dates.push({ before: today });
    }
    
    if (disableWeekends) {
      dates.push({ dayOfWeek: [0, 6] }); // 0 = Sunday, 6 = Saturday
    }
    
    return dates;
  }, [disablePastDates, disableWeekends, today]);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from || today}
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
            disabled={disabledDates}
            className="rounded-md border p-2"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}