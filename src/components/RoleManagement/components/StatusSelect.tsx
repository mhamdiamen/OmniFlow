import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReactNode } from "react";

function StatusDot({ className }: { className?: string }) {
  return (
    <svg
      width="8"
      height="8"
      fill="currentColor"
      viewBox="0 0 8 8"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="4" cy="4" r="4" />
    </svg>
  );
}

interface StatusOption {
  value: string;
  label: string;
  dotColor: string;
}

interface StatusSelectProps {
  label?: string;
  options: StatusOption[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string; // Add className prop
}

export default function StatusSelect({
  label,
  options,
  defaultValue,
  onChange,
  className, // Add className prop
}: StatusSelectProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label htmlFor="status-select">{label}</Label>}
      <Select defaultValue={defaultValue} onValueChange={onChange}>
        <SelectTrigger
          id="status-select"
          className="[&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0"
        >
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent className="[&_*[role=option]>span>svg]:shrink-0 [&_*[role=option]>span>svg]:text-muted-foreground/80 [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="flex items-center gap-2">
                <StatusDot className={option.dotColor} />
                <span className="truncate">{option.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
