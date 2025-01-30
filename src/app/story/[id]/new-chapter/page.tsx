"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import React from "react"; // Import React to use React.use()
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";

export default function AddChapterPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const unwrappedParams = React.use(params); // Unwrap the params Promise
    const storyId = unwrappedParams.id as Id<"stories">; // Access the id property
    const addChapterMutation = useMutation(api.chapters.addChapter);

    const [chapterTitle, setChapterTitle] = useState("");
    const [content, setContent] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await addChapterMutation({
                storyId,
                chapterTitle,
                content,
            });
            router.push(`/story/${storyId}`);
        } catch (error) {
            console.error("Error adding chapter:", error);
        }
    };

    return (
        <AdminPanelLayout>
            <ContentLayout title="Add Chapter">

                <div className="p-4">
                    <h1 className="text-2xl font-bold mb-4">Add a New Chapter</h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="chapterTitle" className="block text-sm font-medium mb-1">
                                Chapter Title
                            </label>
                            <Input
                                id="chapterTitle"
                                value={chapterTitle}
                                onChange={(e) => setChapterTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="content" className="block text-sm font-medium mb-1">
                                Content
                            </label>
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit">Add Chapter</Button>
                    </form>
                </div>
            </ContentLayout>
        </AdminPanelLayout>

    );
}