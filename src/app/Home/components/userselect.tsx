import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useId } from "react";

interface UserSelectProps {
  value: string;
  onChange: (value: string) => void;
  options?: Array<{
    value: string;
    label: string;
    email?: string;
    image?: string;
  }>;
  label?: string;
}

export default function UserSelect({ 
  value, 
  onChange, 
  options = [],
  label = "Options with portrait" 
}: UserSelectProps) {
  const id = useId();

  // If options are provided, use them; otherwise, use the default options
  const userOptions = options.length > 0 ? options : [
    {
      value: "1",
      label: "Jenny Hamilton",
      email: "@jennycodes",
      image: "/avatar-40-01.jpg"
    },
    {
      value: "2",
      label: "Paul Smith",
      email: "@paulsmith",
      image: "/avatar-40-02.jpg"
    },
    {
      value: "3",
      label: "Luna Wyen",
      email: "@wyen.luna",
      image: "/avatar-40-03.jpg"
    }
  ];

  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange} defaultValue={value}>
        <SelectTrigger
          id={id}
          className="h-auto ps-2 [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_img]:shrink-0"
        >
          <SelectValue placeholder="Choose a user" />
        </SelectTrigger>
        <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2">
          {userOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="flex items-center gap-2">
                <img
                  className="rounded-full"
                  src={option.image || `/avatar-40-0${Math.min(parseInt(option.value), 3)}.jpg`}
                  alt={option.label}
                  width={40}
                  height={40}
                />
                <span>
                  <span className="block font-medium">{option.label}</span>
                  <span className="text-muted-foreground mt-0.5 block text-xs">
                    {option.email}
                  </span>
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
