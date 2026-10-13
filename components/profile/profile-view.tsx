"use client"

import {
  AtSignIcon,
  CalendarDaysIcon,
  ClockIcon,
  KeyRoundIcon,
  MailIcon,
  ShieldCheckIcon,
} from "lucide-react"
import { useState } from "react"

import { PageHeader } from "@/components/dashboard/page-header"
import { ChangePasswordDialog } from "@/components/profile/change-password-dialog"
import { StaffAvatar } from "@/components/staff/staff-bits"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDate, formatDateTime } from "@/lib/format"
import type { AuthUser } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/auth-provider"

function getStatus(user: AuthUser) {
  if (user.is_locked)
    return { label: "Locked", tone: "bg-destructive/10 text-destructive" }
  if (!user.active)
    return { label: "Inactive", tone: "bg-muted text-muted-foreground" }
  return { label: "Active", tone: "bg-success-soft text-success" }
}

export function ProfileView() {
  const { user } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)

  // The dashboard only renders for signed-in users, so this is a safeguard
  if (!user) return null

  const name = user.full_name || user.username
  const status = getStatus(user)
  const details = [
    { icon: AtSignIcon, label: "Username", value: user.username },
    { icon: MailIcon, label: "Email", value: user.email },
    {
      icon: ShieldCheckIcon,
      label: "Role",
      value: <span className="capitalize">{user.role}</span>,
    },
    {
      icon: ClockIcon,
      label: "Last login",
      value: user.last_login_at ? formatDateTime(user.last_login_at) : null,
    },
    {
      icon: CalendarDaysIcon,
      label: "Member since",
      value: formatDate(user.created_at),
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Your account"
        title="Profile"
        description="Your account details and sign-in security."
      />

      <Card className="gap-0 rounded-2xl py-0">
        <CardHeader className="flex flex-row items-center gap-4 border-b px-6 py-5">
          <StaffAvatar name={name} className="size-14 text-xl" />
          <div className="min-w-0 space-y-1">
            <CardTitle className="truncate text-lg font-semibold">
              {name}
            </CardTitle>
            <Badge className={cn("h-6 px-2.5 text-xs", status.tone)}>
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-5">
          <dl className="grid gap-5 sm:grid-cols-2">
            {details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="font-medium break-words">{value || "—"}</dd>
                </div>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
              <KeyRoundIcon className="size-4" />
            </span>
            <div className="space-y-1">
              <CardTitle className="font-semibold">Password</CardTitle>
              <CardDescription>
                Change the password you use to log in to MNC People.
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            className="h-10 shrink-0 rounded-full px-5"
            onClick={() => setDialogOpen(true)}
          >
            Change password
          </Button>
        </CardHeader>
      </Card>

      <ChangePasswordDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
