import { CircleCheckIcon } from "lucide-react"
import Link from "next/link"

import { LeaveStatusBadge } from "@/components/leave/leave-status-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatDateRange, formatDayCount } from "@/lib/format"
import { leaveTypeLabels } from "@/lib/leave"
import type { LeaveRequestValues } from "@/lib/schemas/leave"

export type SubmittedLeave = LeaveRequestValues & { name: string; days: number }

export function LeaveSubmitted({
  leave,
  onReset,
}: {
  leave: SubmittedLeave
  onReset: () => void
}) {
  const summary = [
    { label: "Leave type", value: `${leaveTypeLabels[leave.type]} leave` },
    { label: "Dates", value: formatDateRange(leave.startDate, leave.endDate) },
    { label: "Working days", value: formatDayCount(leave.days) },
  ]

  return (
    <Card className="max-w-2xl gap-0 rounded-2xl border-t-4 border-t-brand px-5 py-8 shadow-xs sm:px-10">
      <span className="mb-5 flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
        <CircleCheckIcon className="size-6" />
      </span>
      <h2 className="font-heading text-xl font-semibold">
        Leave request submitted
      </h2>
      <p className="mt-1 text-muted-foreground">
        {leave.name}&apos;s request is waiting for a decision.
      </p>

      <dl className="mt-6 divide-y rounded-xl border">
        {summary.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
          >
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="text-right font-medium">{item.value}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
          <dt className="text-muted-foreground">Status</dt>
          <dd>
            <LeaveStatusBadge status="pending" />
          </dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          variant="outline"
          className="h-11 rounded-full px-5"
          onClick={onReset}
        >
          Submit another request
        </Button>
        <Button asChild className="h-11 rounded-full px-5">
          <Link href="/leaves">View leave requests</Link>
        </Button>
      </div>
    </Card>
  )
}
