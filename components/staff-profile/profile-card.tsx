"use client"

import {
  CalendarIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  type LucideIcon,
} from "lucide-react"
import { useState } from "react"

import { StaffAvatar } from "@/components/staff/staff-bits"
import { EditProfileDialog } from "@/components/staff-profile/edit-profile-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatDate } from "@/lib/format"
import type { StaffMember } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

export function ProfileCard({ staff }: { staff: StaffMember }) {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  // Profile updates are limited to admins and managers
  const canEdit = user?.role === "admin" || user?.role === "manager"

  return (
    <Card className="gap-0 rounded-2xl px-6 py-8 shadow-xs">
      <div className="flex flex-col items-center text-center">
        {staff.photo_url ? (
          // Photos are served from storage, outside next/image's known hosts
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={staff.photo_url}
            alt={staff.full_name}
            className="size-24 rounded-full object-cover shadow-md ring-4 ring-background"
          />
        ) : (
          <StaffAvatar
            name={staff.full_name}
            className="size-24 text-3xl shadow-md ring-4 ring-background"
          />
        )}
        <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight">
          {staff.full_name}
        </h1>
        <span className="mt-2 rounded-full bg-muted px-3 py-1 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
          {staff.role}
        </span>
      </div>

      <ul className="mt-8 space-y-3">
        <ContactRow icon={PhoneIcon}>
          {staff.phone ?? "No phone added"}
        </ContactRow>
        <ContactRow icon={MailIcon}>
          {staff.email ?? "No email added"}
        </ContactRow>
        <ContactRow icon={CalendarIcon}>
          {staff.start_date
            ? `Started ${formatDate(staff.start_date)}`
            : "No start date added"}
        </ContactRow>
      </ul>
      <Separator className="my-3" />
      <ul>
        <ContactRow icon={MapPinIcon}>
          {staff.work_location ?? "No location assigned"}
        </ContactRow>
      </ul>

      {canEdit && (
        <>
          <Button
            variant="secondary"
            className="mt-6 h-12 w-full rounded-xl text-base"
            onClick={() => setEditing(true)}
          >
            <PencilIcon />
            Edit Profile
          </Button>
          <EditProfileDialog
            open={editing}
            onOpenChange={setEditing}
            staff={staff}
          />
        </>
      )}
    </Card>
  )
}

function ContactRow({
  icon: Icon,
  children,
}: {
  icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 break-words">{children}</span>
    </li>
  )
}
