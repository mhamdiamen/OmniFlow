import { useId } from "react";
import { Label } from "@/components/ui/label";

type TaskCardProps = {
  label: string;
  subLabel?: string;
  description?: string;
};

export default function TaskCard({ label, subLabel, description }: TaskCardProps) {
  const id = useId();

  return (
    <div className="border border-input rounded-md p-4 shadow-sm w-full">
      <div className="grid gap-2">
        <Label htmlFor={id} className="font-medium">
          {label}
          {subLabel && (
            <span className="text-muted-foreground text-xs font-normal ml-1">
              ({subLabel})
            </span>
          )}
        </Label>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </div>
    </div>
  );
}
