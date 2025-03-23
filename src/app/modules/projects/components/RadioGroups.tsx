import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LucideIcon } from "lucide-react";
import { useId } from "react";

interface RadioGroupsProps {
  items: {
    value: string;
    label: string;
    Icon: LucideIcon;
  }[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  className?: string;
}

function RadioGroups({
  items,
  defaultValue,
  value,
  onChange,
  name,
  className = "grid-cols-2 min-w-[300px] max-w-[400px]"
}: RadioGroupsProps) {
  const id = useId();

  return (
    <RadioGroup 
      className={className} 
      defaultValue={defaultValue} 
      value={value}
      onValueChange={onChange}
      name={name}
    >
      {items.map((item) => (
        <div
          key={`${id}-${item.value}`}
          className="relative flex flex-col gap-4 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring"
        >
          <div className="flex justify-between gap-2">
            <RadioGroupItem
              id={`${id}-${item.value}`}
              value={item.value}
              className="order-1 after:absolute after:inset-0"
            />
            <item.Icon className="opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
          </div>
          <Label htmlFor={`${id}-${item.value}`}>{item.label}</Label>
        </div>
      ))}
    </RadioGroup>
  );
}

export { RadioGroups };
