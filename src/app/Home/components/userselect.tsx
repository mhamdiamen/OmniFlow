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

  // Use only the provided options, no defaults
  const userOptions = options;

  return (
    <div className="flex items-center gap-3">
      <Label htmlFor={id} className="min-w-24 flex-shrink-0">{label}</Label>
      <div className="flex-grow">
        <Select 
          value={value} 
          onValueChange={onChange} 
          defaultValue={value}
          disabled={userOptions.length === 0}
        >
          <SelectTrigger
            id={id}
            className="h-auto ps-2 w-full [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_img]:shrink-0"
          >
            <SelectValue placeholder={userOptions.length === 0 ? "No users available" : "Choose a user"} />
          </SelectTrigger>
          <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2">
            {userOptions.length > 0 ? (
              userOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    {option.image ? (
                      <img
                        className="rounded-full"
                        src={option.image}
                        alt={option.label}
                        width={40}
                        height={40}
                        onError={(e) => {
                          // If image fails to load, replace with fallback div
                          const target = e.currentTarget;
                          const parent = target.parentElement;
                          if (parent) {
                            // Create fallback div
                            const fallback = document.createElement('div');
                            fallback.className = "flex items-center justify-center rounded-full bg-primary text-primary-foreground";
                            fallback.style.width = "40px";
                            fallback.style.height = "40px";
                            fallback.textContent = option.label?.[0]?.toUpperCase() || option.email?.[0]?.toUpperCase() || '?';
                            
                            // Replace img with fallback
                            parent.replaceChild(fallback, target);
                          }
                        }}
                      />
                    ) : (
                      <div 
                        className="flex items-center justify-center rounded-full bg-primary text-primary-foreground"
                        style={{ width: 40, height: 40 }}
                      >
                        {option.label?.[0]?.toUpperCase() || option.email?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <span>
                      <span className="block font-medium">{option.label}</span>
                      <span className="text-muted-foreground mt-0.5 block text-xs">
                        {option.email}
                      </span>
                    </span>
                  </span>
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No more users available
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
