import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

interface DateRangePickerProps {
    dateRange: { from: Date | undefined; to: Date | undefined };
    placeholder?: string;
    triggerVariant?: "default" | "outline" | "secondary" | "ghost";
    triggerSize?: "default" | "sm" | "lg";
    triggerClassName?: string;
    onDateRangeChange: (newRange: { from: Date | undefined; to: Date | undefined }) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
    dateRange,
    placeholder = "Pick a date",
    triggerVariant = "outline",
    triggerSize = "default",
    triggerClassName,
    onDateRangeChange,
}) => {
    // Initialize internal state with the dateRange prop
    const [dateRangeState, setDateRangeState] = React.useState<{ from: Date | undefined; to: Date | undefined }>(dateRange);

    // Synchronize internal state with the dateRange prop
    React.useEffect(() => {
        setDateRangeState(dateRange);
    }, [dateRange]);

    return (
        <div className="grid gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={triggerVariant}
                        size={triggerSize}
                        className={`w-full justify-start gap-2 truncate text-left font-normal ${!dateRangeState.from && "text-muted-foreground"
                            } ${triggerClassName}`}
                    >
                        <CalendarIcon className="size-4" />
                        {dateRangeState.from ? (
                            dateRangeState.to ? (
                                <>
                                    {format(dateRangeState.from, "LLL dd, y")} -{" "}
                                    {format(dateRangeState.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(dateRangeState.from, "LLL dd, y")
                            )
                        ) : (
                            <span>{placeholder}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRangeState.from ?? new Date()}
                        selected={dateRangeState}
                        numberOfMonths={2}
                        onSelect={(range) => {
                            const newRange = {
                                from: range?.from ?? undefined,
                                to: range?.to ?? undefined,
                            };
                            setDateRangeState(newRange); // Update internal state
                            onDateRangeChange(newRange); // Notify parent component
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default DateRangePicker;