import { LeaveRequests } from "@/components/leaves/leave-requests"
import { leaveRequests, staff } from "@/lib/mock-data"

export default function LeavesPage() {
  return <LeaveRequests initialRequests={leaveRequests} staff={staff} />
}
