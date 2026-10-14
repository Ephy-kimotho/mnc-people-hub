"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon } from "lucide-react"
import toast from "react-hot-toast"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getErrorMessage } from "@/lib/api/errors"
import { deleteEmergencyContact, staffKeys } from "@/lib/api/staff"
import type { EmergencyContact } from "@/lib/types"

type DeleteEmergencyContactDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  staffId: string
  contact?: EmergencyContact
}

export function DeleteEmergencyContactDialog({
  open,
  onOpenChange,
  staffId,
  contact,
}: DeleteEmergencyContactDialogProps) {
  const queryClient = useQueryClient()
  const name = contact?.full_name

  const mutation = useMutation({
    mutationFn: deleteEmergencyContact,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: staffKeys.emergencyContacts(staffId),
      })
      toast.success(`${name} has been removed`)
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, `Couldn't delete ${name}.`))
    },
  })

  // Stay open while the request is running
  function handleOpenChange(isOpen: boolean) {
    if (!mutation.isPending) onOpenChange(isOpen)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="rounded-2xl p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">
            Delete {name}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium">{name}</span> will no longer be listed
            as an emergency contact. This action can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="-mx-6 -mb-6 px-6">
          <AlertDialogCancel
            disabled={mutation.isPending}
            className="h-10 rounded-xl px-5"
          >
            Cancel
          </AlertDialogCancel>
          {/* Keep the dialog open until the request finishes */}
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault()
              if (contact) mutation.mutate(contact.contact_id)
            }}
            disabled={mutation.isPending}
            variant="destructive"
            className="h-10 rounded-xl px-5"
          >
            {mutation.isPending && <Loader2Icon className="animate-spin" />}
            {mutation.isPending ? "Deleting…" : "Delete contact"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
