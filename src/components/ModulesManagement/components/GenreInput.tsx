// GenreInput.tsx
"use client";

import { Label } from "@/components/ui/label";
import { Tag, TagInput } from "emblor";
import { useState, useEffect } from "react";

interface GenreInputProps {
    id: string;
    initialTags?: Tag[];
    placeholder?: string;
    styleClasses?: {
        inlineTagsContainer?: string;
        input?: string;
        tag?: {
            body?: string;
            closeButton?: string;
        };
    };
    onTagsChange?: (tags: Tag[]) => void;
    className?: string;
}

export const GenreInput: React.FC<GenreInputProps> = ({
    id,
    initialTags = [],
    placeholder = "Add a tag",
    styleClasses,
    onTagsChange,
    className,
}) => {
    const [tags, setTags] = useState<Tag[]>(initialTags);
    const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

    // Add this useEffect to update tags when initialTags prop changes
    useEffect(() => {
        if (initialTags && initialTags.length > 0) {
            setTags(initialTags);
        }
    }, [initialTags]);

    const handleSetTags = (value: React.SetStateAction<Tag[]>) => {
        const newTags = typeof value === "function" ? value(tags) : value;
        setTags(newTags);
        if (onTagsChange) {
            onTagsChange(newTags); // Notify parent component of the updated tags
        }
    };

    return (
        <div className="space-y-2">
            <TagInput
                id={id}
                tags={tags}
                setTags={handleSetTags}
                placeholder={placeholder}
                styleClasses={{
                    inlineTagsContainer:
                        styleClasses?.inlineTagsContainer ||
                        "border-input rounded-lg bg-background shadow-sm shadow-black/5 transition-shadow focus-within:border-ring focus-within:outline-none focus-within:ring-[3px] focus-within:ring-ring/20 p-1 gap-1",
                    input:
                        styleClasses?.input ||
                        "w-full focus-visible:outline-none shadow-none px-2 h-7", // Ensure the input is always full width
                    tag: {
                        body:
                            styleClasses?.tag?.body ||
                            "h-7 relative bg-background border border-input hover:bg-background rounded-md font-medium text-xs ps-2 pe-7",
                        closeButton:
                            styleClasses?.tag?.closeButton ||
                            "absolute -inset-y-px -end-px p-0 rounded-e-lg flex size-7 transition-colors outline-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 text-muted-foreground/80 hover:text-foreground",
                    },
                }}
                activeTagIndex={activeTagIndex}
                setActiveTagIndex={setActiveTagIndex}
                className={className}
            />
        </div>
    );
};