import { Badge } from "@/components/ui/badge"
import { leaveStatusLabels } from "@/lib/leave"
import type { LeaveStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const statusStyles: Record<LeaveStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  approved: "bg-success-soft text-success",
  rejected: "bg-destructive/10 text-destructive",
  recalled: "bg-brand-soft text-brand-ink",
}

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <Badge className={cn("h-6 px-2.5", statusStyles[status])}>
      {leaveStatusLabels[status]}
    </Badge>
  )
}
