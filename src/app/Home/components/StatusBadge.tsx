import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
// Removed: import { IconType } from "@remixicon/react";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-x-2.5 rounded-tremor-full bg-background px-2.5 py-1.5 text-tremor-label border",
  {
    variants: {
      status: {
        success: "",
        error: "",
        default: "",
        null: "", // Add null as a valid status
      },
    },
    defaultVariants: {
      status: "default",
    },
  }
);

interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  leftIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  leftLabel: string;
  // Removed: rightLabel: string;
}

export function StatusBadge({
  className,
  status,
  leftIcon: LeftIcon,
  leftLabel,
  // Removed: rightLabel,
  ...props
}: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)} {...props}>
      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
        {LeftIcon && (
          <LeftIcon
            className={cn(
              "-ml-0.5 size-4 shrink-0",
              status === "success" && "text-emerald-600 dark:text-emerald-500",
              status === "error" && "text-red-600 dark:text-red-500"
            )}
            aria-hidden={true}
          />
        )}
        {leftLabel}
      </span>
      {/* Removed: <span className="h-4 w-px bg-border" /> */}
      {/* Removed: <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        {rightLabel}
      </span> */}
    </span>
  );
}