"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectWithIcons } from "../SelectWithIcons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../../convex/_generated/dataModel";
import ReusableCheckbox from "@/components/StoryManagement/components/CheckboxField";
import TextareaWithLimit from "@/components/StoryManagement/components/TextareaWithLimit";

export const AddChapter: React.FC = () => {
  const userStories = useQuery(api.stories.getCurrentUserStories);
  const addChapterMutation = useMutation(api.chapters.addChapter);
  const [isUpdating, setIsUpdating] = useState(false);

  const [selectedStoryId, setSelectedStoryId] = useState<Id<"stories"> | null>(null);
  const [chapterTitle, setChapterTitle] = useState<string>("");
  const [chapterContent, setChapterContent] = useState<string>("");
  const [isDraft, setIsDraft] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState(false); // Open state for the dialog

  const transformedItems =
    userStories?.map((story) => ({
      value: story._id,
      label: story.title || "Untitled Story",
      number: Number(story.chapterCount || 0),
    })) || [];

  const handleSave = async () => {
    if (!selectedStoryId || !chapterTitle.trim() || !chapterContent.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsUpdating(true);
    try {
      await addChapterMutation({
        storyId: selectedStoryId,
        chapterTitle,
        content: chapterContent,
        isDraft,
      });
      toast.success("Chapter added successfully!");
      setSelectedStoryId(null);
      setChapterTitle("");
      setChapterContent("");
      setIsDraft(false);
      setIsOpen(false); // Close dialog after saving

    } catch (error) {
      console.error("Error adding chapter:", error);
      toast.error("Failed to add chapter. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };


  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isDialogOpen) => {
        setIsOpen(isDialogOpen); // Toggle dialog open state

      }}
    >
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)} size="sm">
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          <span>Add Chapter</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="flex flex-col gap-0 overflow-y-visible p-0 sm:max-w-lg [&>button:last-child]:top-3.5">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b border-border px-6 py-4 text-base">
            Add Chapter
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Fill in the fields below to create a new chapter for your story.
        </DialogDescription>
        <div className="overflow-y-auto px-6 pb-6 pt-4">
          <form className="space-y-4">
            {/* Story Selection */}
            <div className="space-y-2">
              <Label htmlFor="select-story">Story</Label>
              {!userStories ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin text-muted-foreground" size={20} />
                </div>
              ) : transformedItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No stories available. Please create a story first.
                </p>
              ) : (
                <SelectWithIcons
                  items={transformedItems}
                  placeholder="Select a story"
                  onSelect={(value) => setSelectedStoryId(value as Id<"stories">)}
                />
              )}
            </div>

            {/* Chapter Title */}
            <div className="space-y-2">
              <Label htmlFor="chapter-title">Title</Label>
              <Input
                id="chapter-title"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                placeholder="Enter chapter title"
                required
              />
            </div>

            {/* Chapter Content */}
            <TextareaWithLimit
              id="chapter-content"
              className="sm:col-span-3"
              maxLength={10000}
              value={chapterContent}
              onChange={(val) => setChapterContent(val)}
              placeholder="Write your chapter content here..."
            />

            <ReusableCheckbox
              id="isDraft"
              label="Draft"
              sublabel="(Mark as draft)"
              description="Save the chapter as a draft for future editing."
              withIcon={false}
              onChange={(checked) => setIsDraft(checked)}
              checked={isDraft}
            />
          </form>
        </div>
        <DialogFooter className="border-t border-border px-6 py-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" aria-hidden="true" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

  );
};
