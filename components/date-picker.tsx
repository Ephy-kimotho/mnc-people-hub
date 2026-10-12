"use client"

import { addYears, endOfYear, parseISO } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatDate, formatISODate } from "@/lib/format"
import { cn } from "@/lib/utils"

type DatePickerProps = {
  id?: string
  // ISO date string (yyyy-MM-dd), or "" when nothing is picked
  value: string
  onChange: (value: string) => void
  placeholder?: string
  invalid?: boolean
  // Days before this ISO date can't be picked
  minDate?: string
  // Range shown in the month/year dropdowns
  startMonth?: Date
  endMonth?: Date
  className?: string
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Pick a date",
  invalid,
  minDate,
  startMonth = new Date(2000, 0),
  endMonth = endOfYear(addYears(new Date(), 2)),
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseISO(value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-invalid={invalid}
          className={cn(
            "w-full justify-between font-normal data-[empty=true]:text-muted-foreground",
            className
          )}
          data-empty={!value}
        >
          {selected ? formatDate(selected) : placeholder}
          <CalendarIcon className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          captionLayout="dropdown"
          className="[--cell-size:--spacing(9)]"
          disabled={minDate ? { before: parseISO(minDate) } : undefined}
          startMonth={startMonth}
          endMonth={endMonth}
          onSelect={(date) => {
            onChange(date ? formatISODate(date) : "")
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
