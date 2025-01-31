import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import InputWithCancel from "../components/InputWithCancel";
import { GenreInput } from "../components/GenreInput";
import { Tag } from "emblor";
import StatusSelect from "../components/StatusSelect";
import CheckboxField from "../components/CheckboxField";
import { toast } from "sonner";
import { Edit, Loader2, Trash2 } from "lucide-react"; // Import Trash2
import TextareaWithLimit from "../components/TextareaWithLimit";
import { api } from "../../../../convex/_generated/api";
import { DynamicDropzone } from "../components/DynamicDropzone";
import { Id } from "../../../../convex/_generated/dataModel";
import { Input } from "@/components/ui/input";

interface UpdateStoryProps {
  storyId: Id<"stories">;
}

export function UpdateStory({ storyId }: UpdateStoryProps) {
  const story = useQuery(api.stories.getStoryById, { id: storyId });
  const updateStory = useMutation(api.stories.updateStory);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genres, setGenres] = useState<Tag[]>([]);
  const [isPrivate, setIsPrivate] = useState(true);
  const [rules, setRules] = useState<string[]>([]);
  const [status, setStatus] = useState<"Ongoing" | "Completed" | "Abandoned">("Ongoing");
  const [storageId, setStorageId] = useState<Id<"_storage"> | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);

  const fileUrl = useQuery(
    api.files.getFileUrl,
    story?.storageId ? { storageId: story.storageId as Id<"_storage"> } : "skip"
  );

  useEffect(() => {
    if (story) {
      setTitle(story.title || "");
      setDescription(story.description || "");
      setGenres(
        (story.genre || []).map((g, index) => ({
          id: `${index}`,
          text: g,
        }))
      );
      setIsPrivate(story.isPrivate || false);
      setRules(story.rules || []);
      setStatus(story.status || "Ongoing");
      setStorageId(story.storageId || undefined);
    }
  }, [story]);

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

    setIsUpdating(true);

    try {
      await updateStory({
        id: storyId,
        title: title.trim(),
        description: description.trim() || undefined,
        genre: genres.map((g) => g.text),
        isPrivate,
        rules: rules || [],
        status,
        storageId,
      });

      toast.success("Story updated successfully!");
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update story. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileUpload = async (file: File): Promise<
    | { status: "error"; error: string }
    | { status: "success"; result: string }
  > => {
    setIsUploading(true);

    // Validate file size and type
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
      toast.error("Failed to upload file. Please try again.");
      return { status: "error", error: "Failed to upload file" };
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" aria-label="Edit Story" size="icon">
          <Edit size={18} aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] md:max-w-[800px] p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Edit Story</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Update the fields below to modify your story. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6">
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
                initialPreview={fileUrl || undefined}
                isLoading={isUploading}
              />
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
                initialTags={genres}
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
                      newRules.splice(index, 1); // Remove the rule at the current index
                      setRules(newRules);
                    }}
                  >
                    <Trash2 className="w-4 h-4 " /> {/* Trash icon */}
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
        <DialogFooter className="flex justify-end space-x-4">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isUpdating || isUploading}
          >
            {isUpdating || isUploading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" aria-hidden="true" />
                {isUpdating ? "Saving..." : "Uploading..."}
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}