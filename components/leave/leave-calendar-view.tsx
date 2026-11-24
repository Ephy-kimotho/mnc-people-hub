"use client"

import { addMonths, endOfMonth, format, startOfMonth } from "date-fns"
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useLeaveCalendar } from "@/hooks/use-extras"
import { getErrorMessage } from "@/lib/api/errors"
import { downloadLeaveCalendar } from "@/lib/api/leaves"
import { saveBlob } from "@/lib/download"
import { formatDateRange, formatISODate } from "@/lib/format"

export function LeaveCalendarView() {
  const [month, setMonth] = useState(() => new Date())
  const start = formatISODate(startOfMonth(month))
  const end = formatISODate(endOfMonth(month))
  const query = useLeaveCalendar(start, end)

  async function download() {
    try {
      const blob = await downloadLeaveCalendar(start, end)
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

      {query.isPending ? (
        <Skeleton className="h-56 rounded-2xl" />
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(query.error, "Couldn't load the calendar.")}
        </p>
      ) : (query.data ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          No approved leave this month.
        </p>
      ) : (
        <Card className="gap-0 rounded-2xl p-0">
          <ul className="divide-y">
            {(query.data ?? []).map((item) => (
              <li
                key={item.request_id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="font-medium">{item.staff_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.staff_role} · {item.leave_type}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDateRange(item.start_date, item.end_date)} ·{" "}
                  {item.days} day(s)
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
