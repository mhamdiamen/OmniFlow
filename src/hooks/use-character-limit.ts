import { useState, useEffect } from "react";

interface UseCharacterLimitProps {
  maxLength: number;
  value?: string;
  onChange?: (value: string) => void;
}

export function useCharacterLimit({ maxLength, value = "", onChange }: UseCharacterLimitProps) {
  const [internalValue, setInternalValue] = useState(value);
  const [characterCount, setCharacterCount] = useState(value.length);

  // Update the character count dynamically when the value changes
  useEffect(() => {
    setCharacterCount(value.length);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value.slice(0, maxLength);

    // Update local state if `onChange` is not provided
    if (!onChange) {
      setInternalValue(newValue);
      setCharacterCount(newValue.length);
    }

    // Trigger `onChange` callback if provided
    onChange?.(newValue);
  };

  return {
    value: onChange ? value : internalValue, // Use external value if `onChange` is provided
    characterCount,
    maxLength,
    handleChange,
  };
}
