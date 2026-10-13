"use client"

import {
  CalendarDaysIcon,
  IdCardIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from "lucide-react"

import { StaffAvatar } from "@/components/staff/staff-bits"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/format"
import type { StaffMember } from "@/lib/types"

type StaffDetailsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff?: StaffMember
}

export function StaffDetailsDialog({
  open,
  onOpenChange,
  staff,
}: StaffDetailsDialogProps) {
  if (!staff) return null

  const details = [
    { icon: IdCardIcon, label: "Staff number", value: staff.staff_number },
    { icon: MapPinIcon, label: "Location", value: staff.work_location },
    {
      icon: CalendarDaysIcon,
      label: "Start date",
      value: staff.start_date && formatDate(staff.start_date),
    },
    { icon: PhoneIcon, label: "Phone", value: staff.phone },
    { icon: MailIcon, label: "Email", value: staff.email },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 rounded-2xl p-0">
        <DialogHeader className="flex-row items-center gap-4 border-b px-6 py-5">
          <StaffAvatar name={staff.full_name} className="size-12 text-lg" />
          <div className="space-y-0.5">
            <DialogTitle className="text-lg font-semibold">
              {staff.full_name}
            </DialogTitle>
            <DialogDescription>{staff.role}</DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6 px-6 py-5">
          <dl className="grid gap-4 sm:grid-cols-2">
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

          <div className="flex justify-end">
            <DialogClose asChild>
              <Button variant="outline" className="h-11 rounded-xl px-6">
                Close
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
