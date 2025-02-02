"use client";

import { Textarea } from "@/components/ui/textarea";
import { useCharacterLimit } from "@/hooks/use-character-limit";

interface TextareaWithLimitProps {
  id: string;
  maxLength: number;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: string; // New prop for height customization
}

export default function TextareaWithLimit({
  id,
  maxLength,
  value,
  onChange,
  placeholder = "",
  className = "",
  height = "150px", // Default height
}: TextareaWithLimitProps) {
  const { characterCount, handleChange } = useCharacterLimit({
    maxLength,
    value,
    onChange,
  });

  return (
    <div className={`space-y-2 ${className}`}>
      <Textarea
        id={id}
        value={value}
        maxLength={maxLength}
        onChange={handleChange}
        placeholder={placeholder}
        aria-describedby={`${id}-characters-left`}
        style={{ height, resize: "none" }} // Use the height prop
      />
      <p
        id={`${id}-characters-left`}
        className="mt-2 text-right text-xs text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <span className="tabular-nums">{maxLength - characterCount}</span> characters left
      </p>
    </div>
  );
}