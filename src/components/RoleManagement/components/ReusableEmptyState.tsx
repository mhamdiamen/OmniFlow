import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  imageSrc?: string; // Path or URL to the image
  actionComponent?: React.ReactNode; // Component to render action (AddStory, AddChapter, etc.)
  className?: string;
}

export function EmptyState({
  title,
  description,
  imageSrc,
  actionComponent,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "text-center",
        "p-14 w-full max-w-[520px]",
        className
      )}
    >
      {imageSrc && (
        <div className="flex justify-center">
          <img
            src={imageSrc}
            alt="Blank State"
            className="w-40 h-40 object-contain" // Made the image larger
          />
        </div>
      )}
      <h2 className="text-foreground font-medium mt-6">
        <strong>{title}</strong>
      </h2>
      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
        {description}
      </p>
      <div className="mt-6">
        {actionComponent && actionComponent}
      </div>
    </div>
  );
}
