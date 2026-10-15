"use client"

import { ClockIcon } from "lucide-react"
import { useRef } from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type TimePickerProps = {
  id?: string
  // 24-hour "HH:mm" string, or "" when nothing is picked
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  invalid?: boolean
  disabled?: boolean
  className?: string
}

// shadcn's time input: the native clock icon is hidden and replaced by our
// own, which opens the browser's time picker where one exists
export function TimePicker({
  id,
  value,
  onChange,
  onBlur,
  invalid,
  disabled,
  className,
}: TimePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function openPicker() {
    try {
      inputRef.current?.showPicker()
    } catch {
      // Some browsers have no time picker; typing still works
      inputRef.current?.focus()
    }
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={invalid}
        disabled={disabled}
        className={cn(
          "appearance-none pr-10 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none",
          className
        )}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        disabled={disabled}
        onClick={openPicker}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground disabled:opacity-50"
      >
        <ClockIcon className="size-4" />
      </button>
    </div>
  )
}
