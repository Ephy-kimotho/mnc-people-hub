"use client"

import {
  CalendarClockIcon,
  CalendarDaysIcon,
  ClockIcon,
  UsersIcon,
} from "lucide-react"

import { StatCard } from "@/components/overview/stat-card"
import { useDashboard } from "@/hooks/use-dashboard"

export function OverviewStats() {
  const { data, isPending } = useDashboard()

  const stats = [
    {
      icon: UsersIcon,
      label: "Total staff",
      value: data?.total_staff,
      caption: data
        ? `${data.active_staff} active in your directory`
        : "People in your directory",
    },
    {
      icon: ClockIcon,
      label: "Pending requests",
      value: data?.pending_leave_requests,
      caption: "Waiting for a decision",
    },
    {
      icon: CalendarDaysIcon,
      label: "On leave today",
      value: data?.on_leave_today.length,
      caption: "Approved time away",
    },
    {
      icon: CalendarClockIcon,
      label: "Upcoming leave",
      value: data?.upcoming_leave.length,
      caption: "Approved and starting soon",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} loading={isPending} {...stat} />
      ))}
    </div>
  )
}
