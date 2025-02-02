"use client";

import {
  Dropzone,
  DropZoneArea,
  DropzoneTrigger,
  DropzoneMessage,
  useDropzone,
} from "@/components/ui/dropzone";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel"; // Import the Id type
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react"; // Import useState and useEffect

interface DropzoneProps {
  onDropFile: (file: File) => Promise<
    | { status: "error"; error: string }
    | { status: "success"; result: string }
  >;
  validation?: {
    accept?: Record<string, string[]>;
    maxSize?: number;
    maxFiles?: number;
  };
  shiftOnMaxFiles?: boolean;
  triggerLabel?: string;
  triggerDescription?: string;
  fallbackText?: string;
  className?: string;
  initialPreview?: string; // Add this line for the initial preview
  isLoading?: boolean; // Add this line for the loading state
}

export function DynamicDropzone({
  onDropFile,
  validation = {
    accept: { "image/*": [".png", ".jpg", ".jpeg"] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
  },
  shiftOnMaxFiles = true,
  triggerLabel = "Upload Cover Image",
  triggerDescription = "Please select an image smaller than 10MB",
  fallbackText = "CI",
  className,
  initialPreview, // Add this line for the initial preview
  isLoading = false, // Add this line for the loading state
}: DropzoneProps) {
  const [isUploadComplete, setIsUploadComplete] = useState(false); // New state to track upload completion
  const dropzone = useDropzone({
    onDropFile,
    validation,
    shiftOnMaxFiles,
  });

  // Fetch the image URL for the new storageId
  const fileUrl = useQuery(
    api.files.getFileUrl,
    dropzone.fileStatuses[0]?.result
      ? { storageId: dropzone.fileStatuses[0].result as Id<"_storage"> }
      : "skip"
  );

  // Use the new file URL or the initial preview
  const avatarSrc = fileUrl || initialPreview;
  const isPending = dropzone.fileStatuses[0]?.status === "pending";

  // Effect to update isUploadComplete when the file is uploaded
  useEffect(() => {
    if (fileUrl && !isLoading) {
      setIsUploadComplete(true); // Set upload as complete when fileUrl is available and loading is done
    }
  }, [fileUrl, isLoading]);

  return (
    <Dropzone {...dropzone}>
      <div className="flex justify-between">
        <DropzoneMessage />
      </div>
      <DropZoneArea>
        <DropzoneTrigger className={cn("flex gap-8 bg-transparent text-sm", className)}>
          <Avatar className={cn(isPending && "animate-pulse")}>
            {isLoading ? ( // Show a spinner while loading
              <div className="flex items-center justify-center h-full w-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {avatarSrc && <AvatarImage className="object-cover" src={avatarSrc} />}
                {!avatarSrc && <AvatarFallback>{fallbackText}</AvatarFallback>}
              </>
            )}
          </Avatar>
          <div className="flex flex-col gap-1 font-semibold">
            <p>{triggerLabel}</p>
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? "Uploading..."
                : isUploadComplete
                ? "Upload complete! Click to change image."
                : triggerDescription}
            </p>
          </div>
        </DropzoneTrigger>
      </DropZoneArea>
    </Dropzone>
  );
}