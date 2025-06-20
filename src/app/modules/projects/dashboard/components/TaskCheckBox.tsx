import { useId } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

type TaskCheckBoxProps = {
  label: string
  prefixLabel?: string // New: shown before the main label
  subLabel?: string
  subLabelClassName?: string // Add this line
  description?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export default function TaskCheckBox({
  label,
  prefixLabel,
  subLabel,
  subLabelClassName = "text-muted-foreground", // Default class
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
      <Label htmlFor={id} className="font-bold flex flex-col">
  <span>{label}</span>

  {prefixLabel && (
    <span className="text-xs font-normal text-muted-foreground mt-1">
      ({prefixLabel})
    </span>
  )}

  {subLabel && (
    <span
      className={`text-xs font-normal mt-1 ${subLabelClassName}`}
    >
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