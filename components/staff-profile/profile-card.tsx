"use client"

import { useQuery } from "@tanstack/react-query"
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
import { PhotoDialog } from "@/components/staff-profile/photo-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchStaffPhoto, staffKeys } from "@/lib/api/staff"
import { formatDate } from "@/lib/format"
import type { StaffMember } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

export function ProfileCard({ staff }: { staff: StaffMember }) {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState(false)
  // Signed links expire, so a link is treated as stale a minute before then
  // and replaced on the next visit or window focus. Uploads also refetch it.
  const photoQuery = useQuery({
    queryKey: staffKeys.photo(staff.staff_id),
    queryFn: () => fetchStaffPhoto(staff.staff_id),
    staleTime: (query) =>
      Math.max((query.state.data?.expires_in ?? 0) - 60, 0) * 1000,
  })
  // Profile updates are limited to admins and managers
  const canEdit = user?.role === "admin" || user?.role === "manager"

  return (
    <Card className="gap-0 rounded-2xl px-6 py-8 shadow-xs">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          {photoQuery.isPending ? (
            <Skeleton className="size-24 rounded-full ring-4 ring-background" />
          ) : photoQuery.data?.url ? (
            // Signed storage links are outside next/image's known hosts
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoQuery.data.url}
              alt={staff.full_name}
              className="size-24 rounded-full object-cover shadow-md ring-4 ring-background"
            />
          ) : (
            <StaffAvatar
              name={staff.full_name}
              className="size-24 text-3xl shadow-md ring-4 ring-background"
            />
          )}
          {canEdit && (
            <Button
              variant="secondary"
              size="icon"
              aria-label="Change photo"
              onClick={() => setEditingPhoto(true)}
              className="absolute right-0 bottom-0 size-8 rounded-full border-2 border-background shadow-sm"
            >
              <PencilIcon className="size-3.5" />
            </Button>
          )}
        </div>
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
          <PhotoDialog
            open={editingPhoto}
            onOpenChange={setEditingPhoto}
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
