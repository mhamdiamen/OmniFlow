import { useId } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

type TaskCheckBoxProps = {
  label: string
  subLabel?: string
  description?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export default function TaskCheckBox({
  label,
  subLabel,
  description,
  checked,
  onCheckedChange,
}: TaskCheckBoxProps) {
  const id = useId()

  return (
    <div className="border-input has-[data-state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="order-1 after:absolute after:inset-0"
        aria-describedby={description ? `${id}-description` : undefined}
      />
      <div className="grid grow gap-2">
        <Label htmlFor={id}>
          {label}
          {subLabel && (
            <span className="text-muted-foreground text-xs leading-[inherit] font-normal">
              ({subLabel})
            </span>
          )}
        </Label>
        {description && (
          <p id={`${id}-description`} className="text-muted-foreground text-xs">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
