"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Check } from "lucide-react"; // Import the Check icon
import { useState } from "react"; // Import useState for state management

export default function follow() {
  // State to track whether the button is clicked
  const [isClicked, setIsClicked] = useState(false);

  // Function to handle button click
  const handleClick = () => {
    setIsClicked(!isClicked); // Toggle the state
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="Add new item"
            onClick={handleClick} // Add onClick handler
          >
            {/* Conditionally render the icon based on the state */}
            {isClicked ? (
              <Check size={16} strokeWidth={2} aria-hidden="true" className="text-green-500" />
            ) : (
              <Plus size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="px-2 py-1 text-xs">
          {isClicked ? "Added!" : "Add new item"} {/* Change tooltip text based on state */}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}