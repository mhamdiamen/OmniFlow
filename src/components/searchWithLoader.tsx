"use client";

import { LoaderCircleIcon, MicIcon, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComponentPropsWithoutRef, useEffect, useState } from "react";

type SearchWithLoaderProps = ComponentPropsWithoutRef<"input"> & {
  label?: string;
  onSearch: (query: string) => void;
  onSelect?: (query: string) => void; // Add this for immediate selection
  debounceTime?: number;
  showMic?: boolean;
  immediateAction?: boolean; // Add this flag for immediate action
};

export function SearchWithLoader({
  label = "",
  onSearch,
  onSelect,
  debounceTime = 300,
  showMic = true,
  immediateAction = false, // Default to false
  ...props
}: SearchWithLoaderProps) {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (inputValue === "") {
      onSearch("");
      setIsLoading(false); // 🔥 Add this line to hide the loader
      return;
    }
  
    setIsLoading(true);
    const timer = setTimeout(() => {
      onSearch(inputValue);
      setIsLoading(false);
  
      if (immediateAction && onSelect) {
        onSelect(inputValue);
      }
    }, debounceTime);
  
    return () => clearTimeout(timer);
  }, [inputValue, debounceTime, onSearch, immediateAction, onSelect]);
  return (
    <div className="*:not-first:mt-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          className="peer ps-9 pe-9"
          placeholder="Search..."
          type="search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          {...props}
        />
        <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
          {isLoading ? (
            <LoaderCircleIcon
              className="animate-spin"
              size={16}
              role="status"
              aria-label="Loading..."
            />
          ) : (
            <SearchIcon size={16} aria-hidden="true" />
          )}
        </div>
        {showMic && (
          <button
            className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Press to speak"
            type="button"
          >
            <MicIcon size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}