"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CircleX } from "lucide-react";
import { useRef } from "react";

interface InputWithCancelProps {
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  inputId: string;
  placeholder?: string;
  label?: string;
  className?: string; // Add className to the interface
}

const InputWithCancel: React.FC<InputWithCancelProps> = ({
  inputValue,
  setInputValue,
  inputId,
  placeholder = "Type something...",
  className = "", // Default to an empty string
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClearInput = () => {
    setInputValue("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <Input
          id={inputId}
          ref={inputRef}
          className="pe-9"
          placeholder={placeholder}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        {inputValue && (
          <button
            className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 "
            aria-label="Clear input"
            onClick={handleClearInput}
          >
            <CircleX size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};

export default InputWithCancel;
