"use client";

import { useQuery, useMutation } from "convex/react";
import { notFound, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Loader, Plus, Check, Heart, Bookmark } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import React, { useState, useEffect } from "react";
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import Image from "next/image";
import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RulesAlert } from "@/components/RulesAlert";
import { Separator } from "@/components/ui/separator";
import { Folder, Tree, File } from "@/components/ui/file-tree";
import { AddChapter } from "@/components/ChapterManagement/CRUD/AddChapter";

export default function StoryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = React.use(params);
    const storyId = unwrappedParams.id as Id<"stories">;
    const router = useRouter();

    const story = useQuery(api.stories.getStoryById, { id: storyId });
    const imageUrl = useQuery(api.stories.getImageUrl, { storageId: story?.storageId ?? null });
    const chapters = useQuery(api.chapters.getChaptersByStory, { storyId }); // Fetch chapters for the story

    const [isFollowing, setIsFollowing] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);

    const isLikedQuery = useQuery(api.stories.isUserLikedStory, { storyId });
    const isBookmarkedQuery = useQuery(api.stories.isUserBookmarkedStory, { storyId });
    const isFollowingQuery = useQuery(api.stories.isUserFollowingStory, { storyId });

    const toggleLike = useMutation(api.stories.toggleLikeStory);
    const toggleBookmark = useMutation(api.stories.toggleBookmarkStory);
    const toggleFollow = useMutation(api.stories.toggleFollowStory);

    useEffect(() => {
        if (isLikedQuery !== undefined) {
            setIsLiked(isLikedQuery);
        }
        if (isBookmarkedQuery !== undefined) {
            setIsBookmarked(isBookmarkedQuery);
        }
        if (isFollowingQuery !== undefined) {
            setIsFollowing(isFollowingQuery);
        }
    }, [isLikedQuery, isBookmarkedQuery, isFollowingQuery]);

    const handleLike = async () => {
        const result = await toggleLike({ storyId });
        setIsLiked(result.isLiked);
    };
    const handleBookmark = async () => {
        if (!story) return; // Ensure story is defined
        const result = await toggleBookmark({ storyId });
        setIsBookmarked(result.isBookmarked);
        setTimeout(() => {
            if (result.isBookmarked) {
                toast.success(`"${story.title}" has been added to your bookmarks.`);
            } else {
                toast.info(`"${story.title}" has been removed from your bookmarks.`);
            }
        }, 0);
    };

    const handleFollow = async () => {
        if (!story) return; // Ensure story is defined
        const result = await toggleFollow({ storyId });
        setIsFollowing(result.isFollowing);
        setTimeout(() => {
            if (result.isFollowing) {
                toast.success(`You are now following "${story.title}"`);
            } else {
                toast.info(`You have unfollowed "${story.title}"`);
            }
        }, 0);
    };

    const handleAddChapter = () => {
        router.push(`/story/${storyId}/new-chapter`);
    };

    if (story === undefined || imageUrl === undefined || chapters === undefined) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader className="w-12 h-12 animate-spin text-gray-500" />
            </div>
        );
    }

    if (!story) {
        notFound();
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Ongoing":
                return (
                    <Badge className="bg-blue-600/10 dark:bg-blue-600/20 hover:bg-blue-600/10 text-blue-500 border-blue-600/60 shadow-none rounded-full">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-2" />
                        Ongoing
                    </Badge>
                );
            case "Completed":
                return (
                    <Badge className="bg-emerald-600/10 dark:bg-emerald-600/20 hover:bg-emerald-600/10 text-emerald-500 border-emerald-600/60 shadow-none rounded-full">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2" />
                        Completed
                    </Badge>
                );
            case "Abandoned":
                return (
                    <Badge className="bg-red-600/10 dark:bg-red-600/20 hover:bg-red-600/10 text-red-500 border-red-600/60 shadow-none rounded-full">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2" />
                        Abandoned
                    </Badge>
                );
            default:
                return null;
        }
    };

    const fileTreeElements = [
        {
            id: "story",
            isSelectable: true,
            name: story?.title || "Untitled",
            children: chapters?.map((chapter, index) => ({
                id: chapter._id,
                isSelectable: true,
                name: `Chapter ${index + 1}: ${chapter.chapterTitle}`,
                metadata: {
                    createdAt: formatDate(chapter.createdAt),
                    author: chapter.authorName,
                },
            })),
        },
    ];

    return (
        <AdminPanelLayout>
            <ContentLayout title={story?.title || "Untitled Story"}>
                <div className="flex flex-col lg:flex-row">
                    {/* Left Sidebar: File Tree */}
                    <Card className=" w-full lg:w-80 p-4 border-b lg:border-r lg:border-b-0">
                        <Button onClick={handleAddChapter} className="mt-4 w-full">
                            Add Chapter
                        </Button>
                        <Tree
                            className="overflow-hidden rounded-md bg-background p-2"
                            initialSelectedId={chapters?.[0]?._id}
                            initialExpandedItems={["story"]}
                            elements={fileTreeElements}
                        >
                            <Folder element={story?.title || "The Lost City"} value="story">
                                {chapters?.map((chapter, index) => (
                                    <File key={chapter._id} value={chapter._id}>
                                        <div className="flex flex-col">
                                            <p>{`Chapter ${index + 1}: ${chapter.chapterTitle}`}</p>
                                            <p className="text-sm text-muted-foreground">
                                            </p>
                                        </div>
                                    </File>
                                ))}
                            </Folder>
                        </Tree>

                    </Card>

                    {/* Main Content Area */}
                    <div className="flex-1 flex justify-center pl-4">
                        <div className=" max-w-full p-4">
                            {imageUrl && (
                                <div className="mb-6">
                                    <div className="aspect-video overflow-hidden rounded-lg relative">
                                        <Image
                                            src={imageUrl}
                                            alt={story.title}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-6">
                                            <div className="mt-4 flex gap-2">
                                                {getStatusBadge(story.status)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <p className="text-sm text-muted-foreground mt-2 mb-3">
                                {formatDate(story.createdAt)}
                            </p>
                            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                                {story.title}
                            </h1>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {story.genre.map((genre, index) => (
                                    <Badge key={index} variant="default" className="rounded text-xs">
                                        {genre}
                                    </Badge>
                                ))}
                            </div>
                            <p className="text-sm text-muted-foreground leading-5 [&:not(:first-child)]:mt-5">
                                {story.description}
                            </p>
                            <div className="flex gap-4 mt-6">
                                <Button
                                    variant="outline"
                                    className="flex items-center gap-2"
                                    onClick={handleFollow}
                                >
                                    {isFollowing ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <Plus className="w-4 h-4" />
                                    )}
                                    <span>{isFollowing ? "Followed" : "Follow"}</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="flex items-center gap-2"
                                    onClick={handleLike}
                                >
                                    <Heart
                                        className={`w-4 h-4 ${isLiked ? "text-red-500 fill-red-500" : ""}`}
                                    />
                                    <span>{isLiked ? "Liked" : "Like"}</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="flex items-center gap-2"
                                    onClick={handleBookmark}
                                >
                                    <Bookmark
                                        className={`w-4 h-4 ${isBookmarked ? "text-yellow-500 fill-yellow-500" : ""}`}
                                    />
                                    <span>{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
                                </Button>
                            </div>
                            <Separator className="my-4" />

                            {story.rules && story.rules.length > 0 && (
                                <RulesAlert rules={story.rules} />
                            )}
                        </div>
                    </div>
                </div>
            </ContentLayout>
        </AdminPanelLayout>
    );
}