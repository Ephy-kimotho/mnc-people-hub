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
import { locationsKey } from "@/lib/api/locations"
import { deleteStaff, staffKeys } from "@/lib/api/staff"
import type { StaffMember } from "@/lib/types"

type DeleteStaffDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff?: StaffMember
}

export function DeleteStaffDialog({
  open,
  onOpenChange,
  staff,
}: DeleteStaffDialogProps) {
  const queryClient = useQueryClient()
  const name = staff?.full_name

  // Locations are refreshed too because their staff counts change
  const mutation = useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.all })
      void queryClient.invalidateQueries({ queryKey: locationsKey })
      toast.success(`${name} has been deleted`)
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
            This removes <span className="font-medium">{name}</span> from your
            staff directory. This action can&apos;t be undone.
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
              if (staff) mutation.mutate(staff.staff_id)
            }}
            disabled={mutation.isPending}
            variant="destructive"
            className="h-10 rounded-xl px-5"
          >
            {mutation.isPending && <Loader2Icon className="animate-spin" />}
            {mutation.isPending ? "Deleting…" : "Delete staff"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
