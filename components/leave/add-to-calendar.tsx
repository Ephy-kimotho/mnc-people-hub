"use client"

import { CalendarIcon, ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  googleCalendarUrl,
  icsFile,
  outlookCalendarUrl,
  type CalendarEvent,
} from "@/lib/calendar"

// Saves the event as an .ics file through a temporary download link
function downloadIcs(event: CalendarEvent) {
  const blob = new Blob([icsFile(event)], { type: "text/calendar" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${event.title}.ics`
  link.click()
  URL.revokeObjectURL(url)
}

function CalendarItems({ event }: { event: CalendarEvent }) {
  return (
    <>
      <DropdownMenuItem asChild>
        <a href={googleCalendarUrl(event)} target="_blank" rel="noreferrer">
          Google Calendar
        </a>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <a href={outlookCalendarUrl(event)} target="_blank" rel="noreferrer">
          Outlook
        </a>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => downloadIcs(event)}>
        Apple Calendar (.ics)
      </DropdownMenuItem>
    </>
  )
}

export function AddToCalendar({ event }: { event: CalendarEvent }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-10 rounded-xl px-3">
          <CalendarIcon />
          Add to Calendar
          <ChevronDownIcon className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <CalendarItems event={event} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// The same options as a nested submenu inside another dropdown
export function AddToCalendarSub({ event }: { event: CalendarEvent }) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <CalendarIcon />
        Add to Calendar
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <CalendarItems event={event} />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
