"use client"

import { useQuery } from "@tanstack/react-query"
import {
  EllipsisVerticalIcon,
  PhoneCallIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { useState } from "react"

import { AddEmergencyContactDialog } from "@/components/staff-profile/add-emergency-contact-dialog"
import { DeleteEmergencyContactDialog } from "@/components/staff-profile/delete-emergency-contact-dialog"
import {
  DetailsCard,
  DetailsList,
} from "@/components/staff-profile/details-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { getErrorMessage } from "@/lib/api/errors"
import { fetchEmergencyContacts, staffKeys } from "@/lib/api/staff"
import type { EmergencyContact, StaffMember } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

export function EmergencyContactsCard({ staff }: { staff: StaffMember }) {
  const { user } = useAuth()
  const [adding, setAdding] = useState(false)
  // Kept after closing so the dialog's text doesn't change as it fades out
  const [deleting, setDeleting] = useState<EmergencyContact>()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const query = useQuery({
    queryKey: staffKeys.emergencyContacts(staff.staff_id),
    queryFn: () => fetchEmergencyContacts(staff.staff_id),
  })

  // Only admins can add or delete contacts; the primary one is listed first
  const isAdmin = user?.role === "admin"
  const contacts = [...(query.data ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary)
  )

  return (
    <DetailsCard
      icon={PhoneCallIcon}
      title={contacts.length > 1 ? "Emergency Contacts" : "Emergency Contact"}
      action={
        isAdmin &&
        contacts.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setAdding(true)}
          >
            <PlusIcon />
            Add
          </Button>
        )
      }
    >
      {query.isPending ? (
        <div className="space-y-3.5">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <p className="text-sm text-muted-foreground">
          {getErrorMessage(query.error, "Couldn't load emergency contacts.")}{" "}
          <button
            type="button"
            onClick={() => query.refetch()}
            className="font-medium text-foreground underline underline-offset-2"
          >
            Try again
          </button>
        </p>
      ) : contacts.length === 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            No emergency contact added.
          </p>
          {isAdmin && (
            <Button
              variant="outline"
              className="h-11 w-full rounded-xl"
              onClick={() => setAdding(true)}
            >
              <PlusIcon />
              Add Emergency Contact
            </Button>
          )}
        </div>
      ) : (
        <div className="divide-y">
          {contacts.map((contact) => (
            <div
              key={contact.contact_id}
              className="flex items-start gap-2 py-4 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1 space-y-3.5">
                {contacts.length > 1 && contact.is_primary && (
                  <Badge variant="secondary" className="font-normal">
                    Primary
                  </Badge>
                )}
                <DetailsList
                  rows={[
                    { label: "Full Name", value: contact.full_name },
                    { label: "Relationship", value: contact.relationship },
                    { label: "Phone", value: contact.phone },
                    { label: "ID No.", value: contact.national_id },
                  ]}
                />
              </div>
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${contact.full_name}`}
                      className="-mt-1 -mr-2"
                    >
                      <EllipsisVerticalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-40">
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => {
                        setDeleting(contact)
                        setConfirmOpen(true)
                      }}
                    >
                      <Trash2Icon />
                      Delete contact
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      )}

      <AddEmergencyContactDialog
        open={adding}
        onOpenChange={setAdding}
        staff={staff}
        isFirst={contacts.length === 0}
      />
      <DeleteEmergencyContactDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        staffId={staff.staff_id}
        contact={deleting}
      />
    </DetailsCard>
  )
}
