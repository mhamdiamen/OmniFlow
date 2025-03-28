"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface DatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  disablePastDates?: boolean;
  disableWeekends?: boolean;
  className?: string;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Select date",
  disabled = false,
  disablePastDates = true,
  disableWeekends = false,
  className,
}: DatePickerProps) {
  const today = new Date();
  const [open, setOpen] = React.useState(false);
  const [portalContainer, setPortalContainer] = React.useState<HTMLElement | null>(null);
  
  React.useEffect(() => {
    // Create a container for the portal
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = '9999';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);
    
    setPortalContainer(container);
    
    return () => {
      document.body.removeChild(container);
    };
  }, []);
  
  // Build disabled dates array based on props
  const disabledDates = React.useMemo(() => {
    const dates = [];
    
    if (disablePastDates) {
      dates.push({ before: today });
    }
    
    if (disableWeekends) {
      dates.push({ dayOfWeek: [0, 6] }); // 0 = Sunday, 6 = Saturday
    }
    
    return dates;
  }, [disablePastDates, disableWeekends, today]);

  const handleSelect = (selectedDate: Date | undefined) => {
    console.log("Date selected:", selectedDate);
    onDateChange(selectedDate);
    setOpen(false);
  };
  
  // Calculate position for the calendar
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  
  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
    }
  };

  return (
    <>
      <Button
        ref={buttonRef}
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal",
          !date && "text-muted-foreground",
          className
        )}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          updatePosition();
          setOpen(!open);
        }}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? format(date, "PPP") : placeholder}
      </Button>
      
      {open && portalContainer && createPortal(
        <div 
          style={{
            position: 'absolute',
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 9999,
            pointerEvents: 'auto'
          }}
        >
          <div className="bg-white rounded-md border shadow-md p-2">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              disabled={disabledDates}
              initialFocus
              className="rounded-md border p-2"
            />
          </div>
        </div>,
        portalContainer
      )}
    </>
  );
}