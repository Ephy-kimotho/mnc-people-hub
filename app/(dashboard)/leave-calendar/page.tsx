import type { Metadata } from "next"

import { LeaveCalendarView } from "@/components/leave/leave-calendar-view"

export const metadata: Metadata = { title: "Leave calendar" }

export default function LeaveCalendarPage() {
  return <LeaveCalendarView />
}
