import { addDays, format, parseISO } from "date-fns"

// An all-day event; start and end are inclusive ISO dates (yyyy-MM-dd)
export type CalendarEvent = {
  title: string
  description?: string
  start: string
  end: string
}

// Calendar apps expect the end of an all-day event to be exclusive
const exclusiveEnd = (end: string) => addDays(parseISO(end), 1)

export function googleCalendarUrl(event: CalendarEvent) {
  const dates = `${format(parseISO(event.start), "yyyyMMdd")}/${format(exclusiveEnd(event.end), "yyyyMMdd")}`
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    details: event.description ?? "",
    dates,
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

export function outlookCalendarUrl(event: CalendarEvent) {
  const params = new URLSearchParams({
    subject: event.title,
    body: event.description ?? "",
    startdt: event.start,
    enddt: format(exclusiveEnd(event.end), "yyyy-MM-dd"),
    allday: "true",
  })
  return `https://outlook.live.com/calendar/0/action/compose?${params}`
}

// Builds a minimal .ics file that Apple Calendar and others can import
export function icsFile(event: CalendarEvent) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MNC People//Leave//EN",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@mncpeople`,
    `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss")}`,
    `DTSTART;VALUE=DATE:${format(parseISO(event.start), "yyyyMMdd")}`,
    `DTEND;VALUE=DATE:${format(exclusiveEnd(event.end), "yyyyMMdd")}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description ?? ""}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}
