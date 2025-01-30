"use client";

import React, { useState, useEffect } from "react";
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
import { SelectWithIcons } from "../SelectWithIcons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../../../convex/_generated/dataModel";
import ReusableCheckbox from "@/components/StoryManagement/components/CheckboxField";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Edit, Loader2 } from "lucide-react";
import TextareaWithLimit from "@/components/StoryManagement/components/TextareaWithLimit";

interface UpdateChapterProps {
    chapterId: Id<"chapters">;
}

export function UpdateChapter({ chapterId }: UpdateChapterProps) {
    const chapter = useQuery(api.chapters.getChapterById, { id: chapterId });
    const userStories = useQuery(api.stories.getCurrentUserStories);
    const updateChapter = useMutation(api.chapters.updateChapter);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [chapterTitle, setChapterTitle] = useState("");
    const [chapterContent, setChapterContent] = useState("");
    const [isDraft, setIsDraft] = useState(false);
    const [selectedStoryId, setSelectedStoryId] = useState<Id<"stories"> | undefined>(undefined);

    const transformedItems =
        userStories?.map((story) => ({
            value: story._id,
            label: story.title || "Untitled Story",
        })) || [];

    useEffect(() => {
        if (chapter) {
            setChapterTitle(chapter.chapterTitle || "");
            setChapterContent(chapter.content || "");
            setIsDraft(chapter.isDraft || false);
            setSelectedStoryId(chapter.storyId || undefined);
        }
    }, [chapter]);


    const handleSave = async () => {
        if (!chapterTitle.trim() || !chapterContent.trim()) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsUpdating(true);

        try {
            await updateChapter({
                id: chapterId,
                chapterTitle: chapterTitle.trim(),
                content: chapterContent.trim(),
                isDraft,
                storyId: selectedStoryId, // `undefined` if not selected
            });

            toast.success("Chapter updated successfully!");
            setIsDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update chapter. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" aria-label="Edit Chapter" size="icon">
                    <Edit size={18} aria-hidden="true" />
                </Button>
            </DialogTrigger>
            <DialogContent className="flex flex-col gap-0 overflow-y-visible p-0 sm:max-w-lg [&>button:last-child]:top-3.5">
                <DialogHeader className="contents space-y-0 text-left">
                    <DialogTitle className="border-b border-border px-6 py-4 text-base">
                        Edit Chapter
                    </DialogTitle>
                </DialogHeader>
                <DialogDescription className="sr-only">
                    Update the fields below to modify your chapter. Click save when you're done.
                </DialogDescription>
                <div className="overflow-y-auto px-6 pb-6 pt-4">
                    <form className="space-y-4">
                        {/* Story Selector */}
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
                                    value={selectedStoryId || undefined}
                                    placeholder="Select a story"
                                    onSelect={(value) => setSelectedStoryId(value as Id<"stories"> | undefined)}
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
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isUpdating}
                        aria-live="polite"
                        aria-busy={isUpdating}
                    >
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
}
