import { useEffect, useState } from "react";
import { Check, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Option {
    value: string;
    label: string;
    count?: number;
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface DataTableFacetedFilterProps {
    title: string;
    options: Option[];
    selectedValues: Set<string>; // Ensure this is Set<string>
    renderOption: (option: Option) => React.ReactNode;
    onChange: (selected: Set<string>) => void; // New prop for handling changes
}

export function DataTableFacetedFilter({ title, options, selectedValues, renderOption, onChange }: DataTableFacetedFilterProps) {
    const [localSelectedValues, setLocalSelectedValues] = useState<Set<string>>(selectedValues);

    useEffect(() => {
        setLocalSelectedValues(selectedValues); // Sync local state with parent state
    }, [selectedValues]);

    const toggleValue = (value: string) => {
        const updatedValues = new Set(localSelectedValues);
        if (updatedValues.has(value)) {
            updatedValues.delete(value);
        } else {
            updatedValues.add(value);
        }
        setLocalSelectedValues(updatedValues);
        onChange(updatedValues); // Notify parent of the change
    };

    const clearFilters = () => {
        const clearedValues = new Set<string>();
        setLocalSelectedValues(clearedValues);
        onChange(clearedValues); // Notify parent component about cleared filters
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 border-dashed">
                    <PlusCircle className="mr-2 size-4" />
                    {title}
                    {localSelectedValues.size > 0 && (
                        <>
                            <Separator orientation="vertical" className="mx-2 h-4" />
                            <Badge
                                variant="secondary"
                                className="rounded-sm px-1 font-normal lg:hidden"
                            >
                                {localSelectedValues.size}
                            </Badge>
                            <div className="hidden space-x-1 lg:flex">
                                {localSelectedValues.size > 2 ? (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal"
                                    >
                                        {localSelectedValues.size} selected
                                    </Badge>
                                ) : (
                                    options
                                        .filter((option) => localSelectedValues.has(option.value))
                                        .map((option) => (
                                            <Badge
                                                variant="secondary"
                                                key={option.value}
                                                className="rounded-sm px-1 font-normal"
                                            >
                                                {option.label}
                                            </Badge>
                                        ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[12.5rem] p-0" align="start">
                <Command>
                    <CommandInput placeholder={`Search ${title}`} />
                    <CommandList className="max-h-full">
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup className="max-h-[18.75rem] overflow-y-auto overflow-x-hidden">
                            {options.map((option) => {
                                const isSelected = localSelectedValues.has(option.value);

                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => toggleValue(option.value)}
                                    >
                                        <div
                                            className={cn(
                                                "mr-2 flex size-4 items-center justify-center rounded-sm border border-primary",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground"
                                                    : "opacity-50 [&_svg]:invisible"
                                            )}
                                        >
                                            <Check className="size-4" aria-hidden="true" />
                                        </div>
                                        {option.icon && (
                                            <option.icon
                                                className="mr-2 size-4 text-muted-foreground"
                                                aria-hidden="true"
                                            />
                                        )}
                                        <span>{option.label}</span>
                                        {option.count && (
                                            <span className="ml-auto flex size-4 items-center justify-center font-mono text-xs">
                                                {option.count}
                                            </span>
                                        )}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                        {localSelectedValues.size > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={clearFilters}
                                        className="justify-center text-center"
                                    >
                                        Clear filters
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
