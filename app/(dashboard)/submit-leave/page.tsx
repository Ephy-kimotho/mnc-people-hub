import { PageHeader } from "@/components/dashboard/page-header"
import { LeaveRequestForm } from "@/components/submit-leave/leave-request-form"

// `?staff=<id>` (from a staff profile) picks that staff member up front
export default async function SubmitLeavePage({
  searchParams,
}: {
  searchParams: Promise<{ staff?: string | string[] }>
}) {
  const { staff } = await searchParams

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Leave management"
        title="Submit Leave Request"
        description="Log time off for a staff member to keep their balance accurate."
      />
      <LeaveRequestForm
        staffId={typeof staff === "string" ? staff : undefined}
      />
    </div>
  )
}
