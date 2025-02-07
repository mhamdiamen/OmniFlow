"use client";

import * as React from "react";
import Image from "next/image";
import { FileText, Upload, X, Loader2 } from "lucide-react";
import Dropzone, { type DropzoneProps, type FileRejection } from "react-dropzone";
import { toast } from "sonner";
import { cn, formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "convex/react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";

interface FileUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  initialPreview?: string;
  progresses?: Record<string, number>;
  accept?: DropzoneProps["accept"];
  maxSize?: DropzoneProps["maxSize"];
  maxFileCount?: DropzoneProps["maxFiles"];
  multiple?: boolean;
  disabled?: boolean;
  logoUrl?: string;
}

export function FileUploader({
  onUpload,
  initialPreview,
  progresses,
  accept = { "image/*": [] },
  maxSize = 1024 * 1024 * 2,
  maxFileCount = 1,
  multiple = false,
  disabled = false,
  logoUrl,
}: FileUploaderProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Fetch uploaded file URL from the API
  const fileUrl = useQuery(
    api.files.getFileUrl,
    logoUrl ? { storageId: logoUrl as Id<"_storage"> } : "skip"
  );

  const avatarSrc = fileUrl || initialPreview;
  const isUploadComplete = Boolean(fileUrl);

  const onDrop = React.useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (!multiple && maxFileCount === 1 && acceptedFiles.length > 1) {
        toast.error("Cannot upload more than 1 file at a time");
        return;
      }

      if (files.length + acceptedFiles.length > maxFileCount) {
        toast.error(`Cannot upload more than ${maxFileCount} files`);
        return;
      }

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, { preview: URL.createObjectURL(file) })
      );
      setFiles([...files, ...newFiles]);

      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ file }) => toast.error(`File ${file.name} was rejected`));
      }

      setIsLoading(true);
      toast.promise(onUpload(newFiles), {
        loading: "Uploading...",
        success: () => {
          setIsLoading(false);
          setFiles([]);
          return "Upload complete!";
        },
        error: "Failed to upload files",
      });
    },
    [files, maxFileCount, multiple, onUpload]
  );

  function onRemove(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="relative flex flex-col gap-6 overflow-hidden">
      <Dropzone onDrop={onDrop} accept={accept} maxSize={maxSize} maxFiles={maxFileCount} multiple={multiple} disabled={disabled}>
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div
            {...getRootProps()}
            className={cn(
              "group relative grid h-52 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-5 py-2.5 text-center transition hover:bg-muted/25",
              isDragActive && "border-muted-foreground/50",
              disabled && "pointer-events-none opacity-60"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full border border-dashed p-3">
                <Upload className="size-7 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Drag and drop files here, or click to select files (Max {formatBytes(maxSize)})
              </p>
            </div>
          </div>
        )}
      </Dropzone>
    </div>
  );
}
