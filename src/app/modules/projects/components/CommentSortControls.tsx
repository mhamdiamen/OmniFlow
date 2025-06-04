"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ✅ Export the type so it can be reused
export type CommentSortOption = "newest" | "oldest" | "most_liked" | "most_replies";

export function CommentSortControls({
    sortBy,
    setSortBy,
}: {
    sortBy: CommentSortOption;
    setSortBy: (value: CommentSortOption) => void;
}) {
    return (
        <div className="flex justify-end mb-4">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as CommentSortOption)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="most_liked">Most liked</SelectItem>
                    <SelectItem value="most_replies">Most replies</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
