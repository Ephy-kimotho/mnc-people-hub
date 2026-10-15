"use client"

import { useQuery } from "@tanstack/react-query"
import { getYear, isAfter, parseISO, startOfToday } from "date-fns"
import {
  CalendarCheckIcon,
  CalendarClockIcon,
  CalendarDaysIcon,
  ClockIcon,
  PalmtreeIcon,
  UsersIcon,
} from "lucide-react"

import { StatCard } from "@/components/overview/stat-card"
import { useDashboard } from "@/hooks/use-dashboard"
import { useVisibleLeaveRequests } from "@/hooks/use-leave-requests"
import { fetchLeaveBalances, leaveKeys } from "@/lib/api/leaves"
import { ANNUAL_LEAVE_DAYS } from "@/lib/leave"
import { canSeeTeamOverview } from "@/lib/permissions"
import { useAuth } from "@/providers/auth-provider"

type Stat = React.ComponentProps<typeof StatCard>

// Admins and managers see the whole team; staff see figures for themselves
export function OverviewStats() {
  const { user } = useAuth()
  return canSeeTeamOverview(user) ? <TeamStats /> : <OwnStats />
}

function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  )
}

function TeamStats() {
  const { data, isPending } = useDashboard()

  return (
    <StatGrid
      stats={[
        {
          icon: UsersIcon,
          label: "Total staff",
          value: data?.total_staff,
          caption: data
            ? `${data.active_staff} active in your directory`
            : "People in your directory",
          loading: isPending,
        },
        {
          icon: ClockIcon,
          label: "Pending requests",
          value: data?.pending_leave_requests,
          caption: "Waiting for a decision",
          loading: isPending,
        },
        {
          icon: CalendarDaysIcon,
          label: "On leave today",
          value: data?.on_leave_today.length,
          caption: "Approved time away",
          loading: isPending,
        },
        {
          icon: CalendarClockIcon,
          label: "Upcoming leave",
          value: data?.upcoming_leave.length,
          caption: "Approved and starting soon",
          loading: isPending,
        },
      ]}
    />
  )
}

// Worked out from the staff member's own requests and leave balance
function OwnStats() {
  const { user } = useAuth()
  const staffId = user?.staff_id ?? ""
  const year = getYear(new Date())
  const leaveQuery = useVisibleLeaveRequests()
  const balanceQuery = useQuery({
    queryKey: leaveKeys.balances(staffId),
    queryFn: () => fetchLeaveBalances(staffId),
    enabled: Boolean(staffId),
  })

  // No annual row yet means none of it has been used this year
  const annual = balanceQuery.data?.find(
    (b) => b.year === year && b.leave_type.toLowerCase() === "annual"
  )
  const entitlement = annual?.entitlement_days ?? ANNUAL_LEAVE_DAYS
  const requests = leaveQuery.data ?? []
  const approved = requests.filter((r) => r.status === "approved")
  const count = (items: unknown[]) =>
    leaveQuery.isError ? undefined : items.length

  return (
    <StatGrid
      stats={[
        {
          icon: PalmtreeIcon,
          label: "Annual leave left",
          value: balanceQuery.isError
            ? undefined
            : (annual?.days_remaining ?? entitlement),
          caption: `Of your ${entitlement} days this year`,
          loading: balanceQuery.isPending && Boolean(staffId),
        },
        {
          icon: ClockIcon,
          label: "Pending requests",
          value: count(requests.filter((r) => r.status === "pending")),
          caption: "Waiting for a decision",
          loading: leaveQuery.isPending,
        },
        {
          icon: CalendarClockIcon,
          label: "Upcoming leave",
          value: count(
            approved.filter((r) =>
              isAfter(parseISO(r.startDate), startOfToday())
            )
          ),
          caption: "Approved and starting soon",
          loading: leaveQuery.isPending,
        },
        {
          icon: CalendarCheckIcon,
          label: "Approved this year",
          value: count(
            approved.filter((r) => getYear(parseISO(r.startDate)) === year)
          ),
          caption: "Your approved requests",
          loading: leaveQuery.isPending,
        },
      ]}
    />
  )
}
