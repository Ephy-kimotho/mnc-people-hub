import {
  CalendarDaysIcon,
  CircleCheckIcon,
  ClockIcon,
  PlusIcon,
  UsersIcon,
} from "lucide-react"
import Link from "next/link"

import { PageHeader } from "@/components/dashboard/page-header"
import { LeaveEssentials } from "@/components/overview/leave-essentials"
import { RecentLeaveRequests } from "@/components/overview/recent-leave-requests"
import { StaffByLocation } from "@/components/overview/staff-by-location"
import { StatCard } from "@/components/overview/stat-card"
import { Button } from "@/components/ui/button"
import { isOnLeave, latestRequests } from "@/lib/leave"
import { leaveRequests, locations, staff } from "@/lib/mock-data"

export default function OverviewPage() {
  const stats = [
    {
      icon: UsersIcon,
      label: "Total staff",
      value: staff.length,
      caption: "People in your directory",
    },
    {
      icon: ClockIcon,
      label: "Pending requests",
      value: leaveRequests.filter((r) => r.status === "pending").length,
      caption: "Waiting for a decision",
    },
    {
      icon: CalendarDaysIcon,
      label: "On leave today",
      value: leaveRequests.filter((r) => isOnLeave(r)).length,
      caption: "Approved time away",
    },
    {
      icon: CircleCheckIcon,
      label: "Total approved",
      value: leaveRequests.filter((r) => r.status === "approved").length,
      caption: "Leave requests approved",
    },
  ]

  // Pair each recent request with its staff member, skipping orphaned ones
  const recentRows = latestRequests(leaveRequests, 5).flatMap((request) => {
    const member = staff.find((s) => s.id === request.staffId)
    return member ? [{ request, staff: member }] : []
  })

  const locationCounts = locations.map((location) => ({
    ...location,
    count: staff.filter((s) => s.locationId === location.id).length,
  }))

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="People overview"
        title="A clear view of your team."
        description="Staff, leave and the decisions that need your attention."
        action={
          <Button asChild className="h-10 self-start rounded-full px-5">
            <Link href="/submit-leave">
              <PlusIcon />
              Submit leave
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <RecentLeaveRequests rows={recentRows} />
        <LeaveEssentials />
      </div>

      <StaffByLocation items={locationCounts} />
    </div>
  )
}
