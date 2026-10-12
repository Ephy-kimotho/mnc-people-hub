import { PageHeader } from "@/components/dashboard/page-header"
import { LeaveRequestForm } from "@/components/submit-leave/leave-request-form"
import { annualLeaveTaken } from "@/lib/leave"
import { leaveRequests, staff } from "@/lib/mock-data"

export default function SubmitLeavePage() {
  const options = staff
    .map(({ id, name, role }) => ({
      id,
      name,
      role,
      leaveTaken: annualLeaveTaken(leaveRequests, id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Leave management"
        title="Submit Leave Request"
        description="Log time off for a staff member to keep their balance accurate."
      />
      <LeaveRequestForm staff={options} />
    </div>
  )
}
