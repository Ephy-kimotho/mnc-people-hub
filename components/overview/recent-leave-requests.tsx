"use client"

import { ArrowRightIcon } from "lucide-react"
import Link from "next/link"

import { AddToCalendar } from "@/components/leave/add-to-calendar"
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useVisibleLeaveRequests } from "@/hooks/use-leave-requests"
import { getErrorMessage } from "@/lib/api/errors"
import { formatDateRange } from "@/lib/format"
import { durationLabel, latestRequests, leaveTypeLabels } from "@/lib/leave"
import { canSeeTeamOverview } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/auth-provider"

// Shared by header and rows so columns line up; applies once the card is wide.
// The calendar column is fixed-width since `auto` would size per row.
const columns =
  "@2xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1.6fr)_minmax(0,0.9fr)_10.5rem] @2xl:gap-x-3"

export function RecentLeaveRequests() {
  // Staff only see their own requests
  const { user } = useAuth()
  const leaveQuery = useVisibleLeaveRequests()
  const rows = latestRequests(leaveQuery.data ?? [], 5)

  return (
    <Card className="@container gap-0 rounded-2xl py-0 shadow-xs">
      <div className="flex items-start justify-between gap-4 px-6 py-6">
        <div>
          <h2 className="font-heading text-lg font-semibold">
            Recent leave requests
          </h2>
          <p className="text-xs text-muted-foreground">
            {canSeeTeamOverview(user)
              ? "The latest activity across your team"
              : "Your latest requests"}
          </p>
        </div>
        <Link
          href="/leaves"
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-brand-ink hover:underline"
        >
          View all <ArrowRightIcon className="size-4" />
        </Link>
      </div>

      <div
        className={cn(
          "hidden gap-4 border-y bg-muted/50 px-6 py-3 text-[0.7rem] font-medium tracking-[0.14em] text-muted-foreground uppercase @2xl:grid",
          columns
        )}
      >
        <span>Staff member</span>
        <span>Leave</span>
        <span>Dates</span>
        <span>Status</span>
        <span className="text-right">Calendar</span>
      </div>

      {leaveQuery.isPending ? (
        <ul className="divide-y border-t @2xl:border-t-0">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="space-y-2 px-6 py-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </li>
          ))}
        </ul>
      ) : leaveQuery.isError ? (
        <div className="flex flex-col items-center gap-3 border-t px-6 py-10 text-center @2xl:border-t-0">
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(leaveQuery.error, "Couldn't load leave requests.")}
          </p>
          <Button
            variant="outline"
            className="h-10 rounded-full px-5"
            onClick={() => leaveQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <p className="border-t px-6 py-10 text-center text-sm text-muted-foreground @2xl:border-t-0">
          No leave requests yet.
        </p>
      ) : (
        <ul className="divide-y border-t @2xl:border-t-0">
          {rows.map((request) => {
            const { staffName: name, staffRole: role } = request
            const type = leaveTypeLabels[request.type]
            const duration = durationLabel(request)
            const dates = formatDateRange(request.startDate, request.endDate)
            return (
              <li
                key={request.id}
                className={cn(
                  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-6 py-4",
                  columns
                )}
              >
                <div>
                  <p className="font-semibold">{name}</p>
                  <p className="text-xs text-muted-foreground">{role}</p>
                </div>

                <div className="hidden @2xl:block">
                  <p className="text-muted-foreground">{type}</p>
                  <p className="text-xs text-muted-foreground">{duration}</p>
                </div>
                <p className="hidden text-sm whitespace-nowrap @2xl:block">
                  {dates}
                </p>

                <div className="justify-self-end @2xl:justify-self-start">
                  <LeaveStatusBadge status={request.status} />
                </div>

                {/* Narrow cards fold leave type and dates into one line */}
                <p className="text-xs text-muted-foreground @2xl:hidden">
                  {type} · {duration}
                  <br />
                  {dates}
                </p>

                <div className="justify-self-end">
                  <AddToCalendar
                    event={{
                      title: `${name} – ${type} leave`,
                      description: `${role} · ${duration}`,
                      start: request.startDate,
                      end: request.endDate,
                    }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
