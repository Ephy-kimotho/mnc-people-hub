"use client"

import { TablePagination } from "@/components/table-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboard } from "@/hooks/use-dashboard"
import { usePagination } from "@/hooks/use-pagination"
import { getErrorMessage } from "@/lib/api/errors"
import { formatDateRange } from "@/lib/format"
import { canSeeTeamOverview } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/auth-provider"

// Shared by header and rows so columns line up once the card is wide enough
const columns =
  "@2xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1.3fr)_minmax(0,1.2fr)] @2xl:gap-x-4"

// Lists other people's leave, so staff don't get it (or fetch its data)
export function OnLeaveToday() {
  const { user } = useAuth()
  return canSeeTeamOverview(user) ? <OnLeaveTodayCard /> : null
}

function OnLeaveTodayCard() {
  const query = useDashboard()
  const rows = query.data?.on_leave_today ?? []
  const pagination = usePagination(rows)

  return (
    <Card className="@container gap-0 rounded-2xl py-0 shadow-xs">
      <div className="px-6 py-6">
        <h2 className="font-heading text-lg font-semibold">On leave today</h2>
        <p className="text-xs text-muted-foreground">
          Staff away on approved leave today
        </p>
      </div>

      <div
        className={cn(
          "hidden border-y bg-muted/50 px-6 py-3 text-[0.7rem] font-medium tracking-[0.14em] text-muted-foreground uppercase @2xl:grid",
          columns
        )}
      >
        <span>Staff member</span>
        <span>Leave</span>
        <span>Location</span>
        <span>Dates</span>
      </div>

      {query.isPending ? (
        <ul className="divide-y border-t @2xl:border-t-0">
          {Array.from({ length: 3 }, (_, i) => (
            <li key={i} className="space-y-2 px-6 py-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </li>
          ))}
        </ul>
      ) : query.isError ? (
        <div className="flex flex-col items-center gap-3 border-t px-6 py-10 text-center @2xl:border-t-0">
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(query.error, "Couldn't load today's leave.")}
          </p>
          <Button
            variant="outline"
            className="h-10 rounded-full px-5"
            onClick={() => query.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <p className="border-t px-6 py-10 text-center text-sm text-muted-foreground @2xl:border-t-0">
          Everyone&apos;s in today.
        </p>
      ) : (
        <ul className="divide-y border-t @2xl:border-t-0">
          {pagination.pageItems.map((leave, index) => (
            <li
              // The API sends no id, so the name and dates stand in for one
              key={`${leave.staff_name}-${leave.start_date}-${index}`}
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-6 py-4",
                columns
              )}
            >
              <div className="min-w-0">
                <p className="font-semibold">{leave.staff_name}</p>
                <p className="text-xs text-muted-foreground">
                  {leave.staff_role}
                </p>
              </div>
              <div className="justify-self-end @2xl:justify-self-start">
                <Badge variant="secondary" className="h-6 px-2.5">
                  {leave.leave_type} Leave
                </Badge>
              </div>
              {/* Narrow cards wrap location and dates under the name */}
              <p className="col-span-full text-sm text-muted-foreground @2xl:col-span-1">
                {leave.work_location ?? "No location"}
              </p>
              <p className="col-span-full text-sm whitespace-nowrap @2xl:col-span-1">
                {formatDateRange(leave.start_date, leave.end_date)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <TablePagination pagination={pagination} label="staff" />
    </Card>
  )
}
