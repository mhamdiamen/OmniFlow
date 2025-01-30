"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { ChevronDown, FileText } from "lucide-react";

type SelectItem = {
    value: string; // Keep value as string for compatibility
    label: string;
    number?: number;
};

type SelectWithIconsProps = {
    items: SelectItem[];
    value?: string; // External value control
    label?: string;
    placeholder?: string;
    onSelect: (value: string | null) => void; // Remains string | null
};

export const SelectWithIcons: React.FC<SelectWithIconsProps> = ({
    items,
    value: externalValue,
    label,
    placeholder = "Select an option",
    onSelect,
}) => {
    const [internalValue, setInternalValue] = useState<string>("");

    useEffect(() => {
        // Sync internal state with external value prop
        setInternalValue(externalValue || "");
    }, [externalValue]);

    const [open, setOpen] = useState<boolean>(false);

    const handleSelect = (currentValue: string | null) => {
        const newValue = currentValue === internalValue ? null : currentValue;
        setInternalValue(newValue ?? ""); // Update internal state
        onSelect(newValue); // Safely pass null if no value
        setOpen(false);
    };

    const selectedItem = items.find((item) => item.value === internalValue);

    return (
        <div className="space-y-2">
            {label && <Label>{label}</Label>}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full flex justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                    >

                        {internalValue ? (
                            <span className="flex min-w-0 items-center gap-2">
                                <span className="truncate">{selectedItem?.label}</span>
                            </span>
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                        <ChevronDown
                            size={16}
                            strokeWidth={2}
                            className="shrink-0 text-muted-foreground/80"
                            aria-hidden="true"
                        />
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0"
                    align="start"
                >
                    <Command>
                        <CommandInput placeholder="Search..." />
                        <CommandList>
                            <CommandEmpty>No options found.</CommandEmpty>
                            <CommandGroup>
                                {items.map((item) => (
                                    <CommandItem
                                        key={item.value}
                                        value={item.value}
                                        onSelect={() => handleSelect(item.value)}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            {item.label}
                                        </div>
                                        {item.number !== undefined && (
                                            <span className="text-xs text-muted-foreground">
                                                {item.number.toLocaleString()}
                                            </span>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
};
