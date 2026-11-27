"use client"

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useLeaveCalendar } from "@/hooks/use-extras"
import { getErrorMessage } from "@/lib/api/errors"
import { downloadLeaveCalendar } from "@/lib/api/leaves"
import { saveBlob } from "@/lib/download"
import { formatDateRange, formatISODate } from "@/lib/format"
import type { CalendarLeave } from "@/lib/types"
import { cn } from "@/lib/utils"

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const leaveTone: Record<string, string> = {
  annual:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
  sick: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  emergency:
    "bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200",
  unpaid: "bg-muted text-muted-foreground",
}

function shortName(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

export function LeaveCalendarView() {
  const [month, setMonth] = useState(() => new Date())
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const query = useLeaveCalendar(
    formatISODate(gridStart),
    formatISODate(gridEnd)
  )

  const monthEvents = (query.data ?? []).filter((item) => {
    const start = parseISO(item.start_date)
    const end = parseISO(item.end_date)
    return start <= monthEnd && end >= monthStart
  })

  function eventsFor(day: Date) {
    return (query.data ?? []).filter((item) =>
      isWithinInterval(day, {
        start: parseISO(item.start_date),
        end: parseISO(item.end_date),
      })
    )
  }

  async function download() {
    try {
      const blob = await downloadLeaveCalendar(
        formatISODate(monthStart),
        formatISODate(monthEnd)
      )
      saveBlob(blob, "mnc-leave-calendar.ics")
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't download the calendar."))
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Team absence"
        title="Leave calendar"
        description="Approved leave for the selected month."
        action={
          <Button
            variant="outline"
            className="h-10 self-start rounded-full px-5"
            onClick={download}
          >
            <DownloadIcon />
            Download .ics
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => setMonth((current) => addMonths(current, -1))}
          >
            <ChevronLeftIcon />
            <span className="sr-only">Previous month</span>
          </Button>
          <p className="min-w-40 text-center font-heading text-lg font-semibold">
            {format(month, "MMMM yyyy")}
          </p>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => setMonth((current) => addMonths(current, 1))}
          >
            <ChevronRightIcon />
            <span className="sr-only">Next month</span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {Object.entries(leaveTone).map(([type, tone]) => (
            <span key={type} className="flex items-center gap-1.5 capitalize">
              <span
                className={cn("size-2.5 rounded-full", tone.split(" ")[0])}
              />
              {type}
            </span>
          ))}
        </div>
      </div>

      {query.isPending ? (
        <Skeleton className="h-[560px] rounded-2xl" />
      ) : query.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(query.error, "Couldn't load the calendar.")}
          </p>
          <Button
            variant="outline"
            className="h-10 rounded-full px-5"
            onClick={() => query.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:hidden">
            {monthEvents.map((event) => (
              <Card
                key={event.request_id}
                className="gap-2 rounded-2xl p-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{event.staff_name}</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 rounded-full capitalize",
                      leaveTone[event.leave_type.toLowerCase()] ??
                        "bg-muted text-muted-foreground"
                    )}
                  >
                    {event.leave_type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {event.staff_role}
                </p>
                <p className="text-sm">
                  {formatDateRange(event.start_date, event.end_date)} ·{" "}
                  {event.days} day(s)
                </p>
              </Card>
            ))}
          </div>

          <div className="hidden sm:block">
            <Card className="gap-0 overflow-hidden rounded-2xl p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-7 border-b bg-muted/40">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="px-2 py-2 text-center text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((day) => {
                  const events = eventsFor(day)
                  const inMonth = isSameMonth(day, month)
                  const weekend = day.getDay() === 0 || day.getDay() === 6
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "min-h-24 border-r border-b p-1.5 last:border-r-0",
                        weekend && "bg-muted/20",
                        !inMonth && "bg-muted/40 text-muted-foreground/60"
                      )}
                    >
                      <div className="mb-1 flex items-center justify-end">
                        <span
                          className={cn(
                            "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                            isToday(day) &&
                              "bg-emerald-800 font-semibold text-white"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {events.slice(0, 3).map((event) => (
                          <LeaveChip key={event.request_id} event={event} />
                        ))}
                        {events.length > 3 ? (
                          <p className="px-1 text-[0.65rem] text-muted-foreground">
                            +{events.length - 3} more
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
            </Card>
          </div>
        </>
      )}

      {!query.isPending && !query.isError && monthEvents.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No approved leave this month.
        </p>
      ) : null}
    </div>
  )
}

function LeaveChip({ event }: { event: CalendarLeave }) {
  const type = event.leave_type.toLowerCase()
  const title = `${event.staff_name} · ${event.leave_type} · ${formatDateRange(
    event.start_date,
    event.end_date
  )}`
  return (
    <p
      title={title}
      className={cn(
        "truncate rounded px-1.5 py-0.5 text-[0.65rem] font-medium",
        leaveTone[type] ?? "bg-muted text-muted-foreground"
      )}
    >
      {shortName(event.staff_name)}
    </p>
  )
}
