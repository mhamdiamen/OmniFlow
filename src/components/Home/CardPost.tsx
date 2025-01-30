import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Link as LinkIcon,
  Check,
  Plus,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { formatTimeAgo } from "@/lib/dateUtils";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { formatNumber } from "@/lib/formatNumber";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Badge } from "../ui/badge";

interface CardPostProps {
  user: {
    avatar: string;
    name: string;
  };
  post: {
    _id: Id<"stories">;
    image?: string;
    title: string;
    status: "Ongoing" | "Completed" | "Abandoned";
    content: string;
    hashtags?: string[];
    link?: {
      title?: string;
      description?: string;
      icon?: React.ReactNode;
    };
    createdAt?: string;
  };
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
  };
  actions?: {
    onComment?: () => void;
    onShare?: () => void;
    onMore?: () => void;
  };
}

export default function CardPost({ user, post, engagement, actions }: CardPostProps) {
  const [hovered, setHovered] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const router = useRouter();
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Fetch the current user's like and bookmark status
  const isLiked = useQuery(api.stories.isUserLikedStory, { storyId: post._id });
  const isBookmarkedQuery = useQuery(api.stories.isUserBookmarkedStory, { storyId: post._id });

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

  // Sync local state with query result
  useEffect(() => {
    if (isBookmarkedQuery !== undefined) {
      setIsBookmarked(isBookmarkedQuery);
    }
  }, [isBookmarkedQuery]);

  // Mutations to toggle like and bookmark status
  const toggleLike = useMutation(api.stories.toggleLikeStory);
  const toggleBookmark = useMutation(api.stories.toggleBookmarkStory);
  const toggleFollow = useMutation(api.stories.toggleFollowStory);

  // Fetch the follow status
  const isFollowingStory = useQuery(api.stories.isUserFollowingStory, {
    storyId: post._id,
  });

  const timeAgo = formatTimeAgo(post.createdAt);

  useEffect(() => {
    if (isFollowingStory !== undefined) {
      setIsFollowing(isFollowingStory);
      setIsClicked(isFollowingStory);
    }
  }, [isFollowingStory]);

  // Handle like button click
  const handleLike = useCallback(async () => {
    await toggleLike({ storyId: post._id });
  }, [toggleLike, post._id]);

  // Handle bookmark button click
  const handleBookmark = useCallback(async () => {
    const result = await toggleBookmark({ storyId: post._id });
    setIsBookmarked(result.isBookmarked);
    setTimeout(() => {
      if (result.isBookmarked) {
        toast.success(`"${post.title}" has been added to your bookmarks.`);
      } else {
        toast.info(`"${post.title}" has been removed from your bookmarks.`);
      }
    }, 0);
  }, [toggleBookmark, post._id, post.title]);

  // Handle follow button click
  const handleClick = useCallback(async () => {
    const result = await toggleFollow({ storyId: post._id });
    setIsFollowing(result.isFollowing);
    setIsClicked(result.isFollowing);

    setTimeout(() => {
      if (result.isFollowing) {
        toast.success(`You are now following "${post.title}"`);
      } else {
        toast.info(`You have unfollowed "${post.title}"`);
      }
    }, 0);
  }, [toggleFollow, post._id, post.title]);

  // Handle image click to navigate to story details
  const handleImageClick = useCallback(() => {
    router.push(`/story/${post._id}`);
  }, [router, post._id]);

  // Handle image load and error events
  const handleImageLoad = () => {
    setIsImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsImageLoading(false);
  };

  return (
    <Card className="w-full max-w-lg shadow-none flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
            {user.avatar ? (
              <Image
                src={user.avatar}
                className="rounded-full object-contain"
                alt={`${user.name}'s avatar`}
                height={32}
                width={32}
              />
            ) : (
              <span className="text-lg font-medium text-foreground">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <h6 className="text-sm leading-none font-medium">{user.name}</h6>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {timeAgo}
            </span>
          </div>
        </div>
        {/* Follow button */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={isClicked ? "Following" : "Follow story"}
                onClick={handleClick}
              >
                {isClicked ? (
                  <Check size={16} strokeWidth={2} aria-hidden="true" className="text-green-500" />
                ) : (
                  <Plus size={16} strokeWidth={2} aria-hidden="true" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="px-2 py-1 text-xs">
              {isClicked ? "Followed" : "Follow story"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        {/* Content Section */}
        <div className="p-6 flex-1 flex flex-col">
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-2">
            {post.title}
          </h4>
          <div className="leading-5 text-sm text-muted-foreground flex-1 ">
            {post.content}
          </div>

          {/* Link Preview */}
          {post.link && (
            <div className="mb-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white dark:bg-zinc-700 rounded-xl">
                    {post.link.icon || <LinkIcon className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {post.link.title}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {post.link.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Image Section */}
        {post.image && !imageError && (
          <div
            className="relative aspect-video bg-muted border-y overflow-hidden cursor-pointer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={handleImageClick}
          >
            <Image
              src={post.image}
              alt={post.title}
              fill
              /* sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" */
              className={cn(
                "object-cover transition-all duration-300 ease-out",
                hovered && "blur-sm scale-[0.98]"
              )}
              priority
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div
              className={cn(
                "absolute inset-0 bg-black/50 flex flex-col justify-end p-4 transition-opacity duration-300",
                hovered ? "opacity-100" : "opacity-0"
              )}
            >
              <div className="text-xl md:text-2xl font-medium bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-200">
                {getStatusBadge(post.status)}
              </div>
            </div>
          </div>
        )}
        {imageError && (
          <div className="relative aspect-video bg-muted border-y overflow-hidden flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Image failed to load</span>
          </div>
        )}
      </CardContent>
      <Separator />
      {/* Engagement Section */}
      <CardFooter className="flex items-center justify-between py-2 px-4">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={handleLike}
            className={cn(
              "flex items-center gap-2 text-sm transition-colors",
              isLiked
                ? "text-rose-600"
                : "text-zinc-500 dark:text-zinc-400 hover:text-rose-600"
            )}
          >
            <Heart
              className={cn(
                "w-5 h-5 transition-all",
                isLiked && "fill-current scale-110"
              )}
            />
            <span>{formatNumber(engagement?.likes || 0)}</span>
          </button>
          <button
            type="button"
            onClick={actions?.onComment}
            className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-blue-500 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{engagement?.comments}</span>
          </button>
          <button
            type="button"
            onClick={actions?.onShare}
            className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-green-500 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span>{engagement?.shares}</span>
          </button>
        </div>
        <button
          type="button"
          onClick={handleBookmark}
          className={cn(
            "p-2 rounded-full transition-all",
            isBookmarked
              ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10"
              : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          )}
        >
          <Bookmark
            className={cn(
              "w-5 h-5 transition-transform",
              isBookmarked && "fill-current scale-110"
            )}
          />
        </button>
      </CardFooter>
    </Card>
  );
}