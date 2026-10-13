import { Badge } from "@/components/ui/badge"
import type { AuthUser, RoleName } from "@/lib/types"
import { cn } from "@/lib/utils"

function getStatus(user: Pick<AuthUser, "active" | "is_locked">) {
  if (user.is_locked)
    return { label: "Locked", tone: "bg-destructive/10 text-destructive" }
  if (!user.active)
    return { label: "Inactive", tone: "bg-muted text-muted-foreground" }
  return { label: "Active", tone: "bg-success-soft text-success" }
}

export function UserStatusBadge({
  user,
  className,
}: {
  user: Pick<AuthUser, "active" | "is_locked">
  className?: string
}) {
  const status = getStatus(user)
  return <Badge className={cn(status.tone, className)}>{status.label}</Badge>
}

const roleTones: Record<RoleName, string> = {
  admin: "bg-brand-soft text-brand-ink",
  manager: "bg-primary/10 text-primary",
  staff: "bg-muted text-muted-foreground",
}

export function UserRoleBadge({ role }: { role: RoleName }) {
  return <Badge className={cn("capitalize", roleTones[role])}>{role}</Badge>
}
