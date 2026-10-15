import { PlusIcon } from "lucide-react"
import Link from "next/link"

import { PageHeader } from "@/components/dashboard/page-header"
import { LeaveEssentials } from "@/components/overview/leave-essentials"
import { OnLeaveToday } from "@/components/overview/on-leave-today"
import { OverviewStats } from "@/components/overview/overview-stats"
import { RecentLeaveRequests } from "@/components/overview/recent-leave-requests"
import { StaffByLocation } from "@/components/overview/staff-by-location"
import { Button } from "@/components/ui/button"

export default function OverviewPage() {
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

      <OverviewStats />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <RecentLeaveRequests />
        <LeaveEssentials />
      </div>

      <OnLeaveToday />
      <StaffByLocation />
    </div>
  )
}
