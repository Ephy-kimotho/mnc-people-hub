"use client"

import { useQuery } from "@tanstack/react-query"
import {
  ShieldCheckIcon,
  UserCheckIcon,
  UserCogIcon,
  UsersIcon,
} from "lucide-react"

import { StatCard } from "@/components/overview/stat-card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchUserStats, usersKeys } from "@/lib/api/users"

export function UserStats() {
  const { data, isError } = useQuery({
    queryKey: usersKeys.stats,
    queryFn: fetchUserStats,
  })

  // The table below reports load errors, so the cards just stay out of the way
  if (isError) return null

  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    )
  }

  const stats = [
    {
      icon: UsersIcon,
      label: "Total users",
      value: data.total_users,
      caption: `${data.active_users} active · ${data.inactive_users} inactive`,
    },
    {
      icon: ShieldCheckIcon,
      label: "Admins",
      value: data.by_role.admin ?? 0,
      caption: "Full access to MNC People",
    },
    {
      icon: UserCogIcon,
      label: "Managers",
      value: data.by_role.manager ?? 0,
      caption: "Review leave requests",
    },
    {
      icon: UserCheckIcon,
      label: "Staff",
      value: data.by_role.staff ?? 0,
      caption: "Submit their own leave",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  )
}
