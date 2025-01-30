"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useMutation } from "convex/react";
import InputWithCancel from "../components/InputWithCancel";
import { GenreInput } from "../components/GenreInput";
import { Tag } from "emblor";
import StatusSelect from "../components/StatusSelect";
import CheckboxField from "../components/CheckboxField";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import TextareaWithLimit from "../components/TextareaWithLimit";
import { api } from "../../../../convex/_generated/api";
import { DynamicDropzone } from "../components/DynamicDropzone";
import { Id } from "../../../../convex/_generated/dataModel";
import { Input } from "@/components/ui/input";

export function AddStory() {
  const createStory = useMutation(api.stories.createStory);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genres, setGenres] = useState<Tag[]>([]);
  const [isPrivate, setIsPrivate] = useState(true);
  const [rules, setRules] = useState<string[]>([]);
  const [status, setStatus] = useState<"Ongoing" | "Completed" | "Abandoned">("Ongoing");
  const [isSaving, setIsSaving] = useState(false);
  const [storageId, setStorageId] = useState<Id<"_storage"> | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setGenres([]);
    setIsPrivate(true);
    setRules([]);
    setStatus("Ongoing");
    setStorageId(undefined);
    setFileError(null);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }

    if (description && description.length > 350) {
      toast.error("Description cannot exceed 350 characters.");
      return;
    }

    if (rules && rules.some((rule) => rule.length > 200)) {
      toast.error("Each rule cannot exceed 200 characters.");
      return;
    }

    if (genres.length === 0) {
      toast.error("At least one genre is required.");
      return;
    }

    setIsSaving(true);

    try {
      const genresArray = genres.map((genre) => genre.text);
      const rulesArray = rules || [];

      await createStory({
        title: title.trim() || "Untitled",
        description: description || undefined,
        genre: genresArray,
        isPrivate,
        rules: rulesArray,
        status,
        storageId,
      });

      toast.success("Story created successfully!");
      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create story. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (file: File): Promise<
    | { status: "error"; error: string }
    | { status: "success"; result: string }
  > => {
    setIsUploading(true);
    setFileError(null);

    if (file.size > 10 * 1024 * 1024) {
      setIsUploading(false);
      return { status: "error", error: "File size must be less than 10MB." };
    }

    if (!file.type.startsWith("image/")) {
      setIsUploading(false);
      return { status: "error", error: "Only image files are allowed." };
    }

    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const { storageId } = await response.json();
      setStorageId(storageId as Id<"_storage">);

      toast.success("File uploaded successfully!");
      return { status: "success", result: storageId as string };
    } catch (error) {
      console.error(error);
      setFileError("Failed to upload file. Please try again.");
      toast.error("Failed to upload file. Please try again.");
      return { status: "error", error: "Failed to upload file" };
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)} size="sm">
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          <span>Add Story</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] md:max-w-[800px] p-4 md:p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Add Story</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Fill in the fields to create a new story. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:gap-6">
          {/* Title Field */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="sm:col-span-1 text-sm font-bold">
              Title
            </Label>
            <InputWithCancel
              inputValue={title}
              setInputValue={setTitle}
              inputId="title"
              placeholder="Story Title"
              className="sm:col-span-3"
            />
          </div>

          {/* Cover Image Field */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="coverImage" className="sm:col-span-1 text-sm font-bold">
              Cover Image
            </Label>
            <div className="sm:col-span-3">
              <DynamicDropzone
                onDropFile={handleFileUpload}
                triggerLabel="Upload Cover Image"
                triggerDescription="Please select an image smaller than 10MB"
                fallbackText="CI"
                isLoading={isUploading}
              />
              {fileError && (
                <p className="text-sm text-red-500 mt-2">{fileError}</p>
              )}
            </div>
          </div>

          {/* Description Field */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="sm:col-span-1 text-sm font-bold">
              Description
            </Label>
            <TextareaWithLimit
              id="description"
              className="sm:col-span-3"
              maxLength={400}
              value={description}
              onChange={(val) => setDescription(val)}
              placeholder="Short description (optional)"
            />
          </div>

          {/* Genre Field */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="genre" className="sm:col-span-1 text-sm font-bold">
              Genre
            </Label>
            <div className="sm:col-span-3">
              <GenreInput
                id="genre"
                initialTags={[]}
                placeholder="Add genres, e.g., Adventure, Fantasy"
                onTagsChange={setGenres}
              />
            </div>
          </div>

          {/* Rules Field */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="rules" className="sm:col-span-1 text-sm font-bold">
              Rules
            </Label>
            <div className="sm:col-span-3 space-y-3">
              {rules.map((rule, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    id={`rule-${index + 1}`}
                    placeholder="Enter a rule (e.g., No hate speech)"
                    value={rule}
                    onChange={(e) => {
                      const newRules = [...rules];
                      newRules[index] = e.target.value;
                      setRules(newRules);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newRules = [...rules];
                      newRules.splice(index, 1);
                      setRules(newRules);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setRules([...rules, ""])}
                className="text-sm underline hover:no-underline"
              >
                + Add another rule
              </button>
            </div>
          </div>

          {/* Status Field */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="sm:col-span-1 text-sm font-bold">
              Status
            </Label>
            <div className="sm:col-span-3">
              <StatusSelect
                options={[
                  { value: "Ongoing", label: "Ongoing", dotColor: "text-blue-500" },
                  { value: "Completed", label: "Completed", dotColor: "text-emerald-600" },
                  { value: "Abandoned", label: "Abandoned", dotColor: "text-red-500" },
                ]}
                defaultValue={status}
                onChange={(value) => setStatus(value as "Ongoing" | "Completed" | "Abandoned")}
              />
            </div>
          </div>

          {/* Private Field */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="isPrivate" className="sm:col-span-1 text-sm font-bold">
              Private
            </Label>
            <div className="sm:col-span-3">
              <CheckboxField
                id="isPrivate"
                label="Private"
                sublabel="(Make the story private)"
                description="Only visible to you and collaborators."
                withIcon={false}
                className="sm:col-span-3"
                onChange={(checked) => setIsPrivate(checked)}
                checked={isPrivate}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isUploading}
          >
            {isSaving || isUploading ? (
              <Loader2 className="animate-spin mr-2 h-4 w-4" aria-hidden="true" />
            ) : null}
            {isSaving ? "Saving..." : isUploading ? "Uploading..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}