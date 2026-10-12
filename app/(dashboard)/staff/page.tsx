import { StaffDirectory } from "@/components/staff/staff-directory"
import { annualLeaveTaken } from "@/lib/leave"
import { leaveRequests, locations, staff } from "@/lib/mock-data"

export default function StaffPage() {
  const members = staff.map((member) => ({
    ...member,
    leaveTaken: annualLeaveTaken(leaveRequests, member.id),
  }))

  return <StaffDirectory initialStaff={members} locations={locations} />
}
