"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Building2Icon,
  Loader2Icon,
  PhoneIcon,
  PlusIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ContactDialog,
  OwnerDialog,
} from "@/components/property/property-record-dialogs"
import { useContacts, useOwners } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import {
  deleteContact,
  deleteOwner,
  propertyKeys,
} from "@/lib/api/properties"

export function PropertyOwnershipTab({
  propertyId,
  canManage,
}: {
  propertyId: string
  canManage: boolean
}) {
  const queryClient = useQueryClient()
  const owners = useOwners(propertyId)
  const contacts = useContacts(propertyId)
  const [ownerOpen, setOwnerOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)

  const removeOwner = useMutation({
    mutationFn: (id: string) => deleteOwner(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Owner removed")
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't remove the owner.")),
  })

  const removeContact = useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Contact removed")
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't remove the contact.")),
  })

  return (
    <div className="grid gap-4 p-5">
      <Card className="gap-0 rounded-2xl p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2 className="font-heading text-lg font-semibold">
              Ownership structure
            </h2>
            <p className="text-sm text-muted-foreground">
              Who holds this property and in what share.
            </p>
          </div>
          {canManage ? (
            <Button
              className="h-9 rounded-full bg-emerald-800 px-4 text-white hover:bg-emerald-900"
              onClick={() => setOwnerOpen(true)}
            >
              <PlusIcon />
              Add owner
            </Button>
          ) : null}
        </div>

        {owners.isPending ? (
          <Skeleton className="m-5 h-16 rounded-xl" />
        ) : owners.isError ? (
          <p className="px-5 py-8 text-sm text-destructive">
            {getErrorMessage(owners.error, "Couldn't load owners.")}
          </p>
        ) : (owners.data ?? []).length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-sm text-muted-foreground">
            <Building2Icon className="size-5 text-emerald-800" />
            No owners recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <th className="px-5 py-3">Owner name</th>
                  <th className="px-5 py-3">Entity type</th>
                  <th className="px-5 py-3 text-right">Share</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {(owners.data ?? []).map((owner) => (
                  <tr key={owner.owner_id}>
                    <td className="px-5 py-3 font-medium">{owner.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {owner.entity_type}
                    </td>
                    <td className="px-5 py-3 text-right font-medium">
                      {owner.share_pct}%
                    </td>
                    <td className="px-5 py-3 text-right">
                      {canManage ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full text-destructive"
                          disabled={removeOwner.isPending}
                          onClick={() => removeOwner.mutate(owner.owner_id)}
                        >
                          {removeOwner.isPending ? (
                            <Loader2Icon className="animate-spin" />
                          ) : (
                            <Trash2Icon />
                          )}
                          Remove
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="gap-0 rounded-2xl p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2 className="font-heading text-lg font-semibold">Key contacts</h2>
            <p className="text-sm text-muted-foreground">
              Security, caretaker, property manager and other contacts.
            </p>
          </div>
          {canManage ? (
            <Button
              variant="outline"
              className="h-9 rounded-full px-4"
              onClick={() => setContactOpen(true)}
            >
              <PlusIcon />
              Add contact
            </Button>
          ) : null}
        </div>

        {contacts.isPending ? (
          <Skeleton className="m-5 h-16 rounded-xl" />
        ) : contacts.isError ? (
          <p className="px-5 py-8 text-sm text-destructive">
            {getErrorMessage(contacts.error, "Couldn't load contacts.")}
          </p>
        ) : (contacts.data ?? []).length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-sm text-muted-foreground">
            <UserIcon className="size-5 text-emerald-800" />
            No key contacts recorded yet.
          </div>
        ) : (
          <ul className="divide-y">
            {(contacts.data ?? []).map((contact) => (
              <li
                key={contact.contact_id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {contact.role}
                    </p>
                    {contact.is_primary ? (
                      <Badge variant="secondary" className="rounded-full">
                        Primary
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 font-medium">{contact.name}</p>
                  {contact.phone ? (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <PhoneIcon className="size-3.5" />
                      {contact.phone}
                    </p>
                  ) : null}
                </div>
                {canManage ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-destructive"
                    disabled={removeContact.isPending}
                    onClick={() => removeContact.mutate(contact.contact_id)}
                  >
                    {removeContact.isPending ? (
                      <Loader2Icon className="animate-spin" />
                    ) : (
                      <Trash2Icon />
                    )}
                    Remove
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <OwnerDialog
        open={ownerOpen}
        onOpenChange={setOwnerOpen}
        propertyId={propertyId}
      />
      <ContactDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        propertyId={propertyId}
      />
    </div>
  )
}
