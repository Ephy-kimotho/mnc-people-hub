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
import { deleteProperty, propertyKeys } from "@/lib/api/properties"
import type { Property } from "@/lib/types"

export function DeletePropertyDialog({
  open,
  onOpenChange,
  property,
  onDeleted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  property?: Property
  onDeleted?: () => void
}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success(`${property?.alias ?? "Property"} has been deleted`)
      onOpenChange(false)
      onDeleted?.()
    },
    onError: (error) =>
      toast.error(
        getErrorMessage(
          error,
          "Couldn't delete this property. Remove its units and leases first."
        )
      ),
  })

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => !mutation.isPending && onOpenChange(next)}
    >
      <AlertDialogContent className="rounded-2xl p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">
            Delete {property?.alias}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This removes the property record. Properties with units or leases
            can&apos;t be deleted — remove those first. This can&apos;t be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="-mx-6 -mb-6 px-6">
          <AlertDialogCancel
            disabled={mutation.isPending}
            className="h-10 rounded-xl px-5"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault()
              if (property) mutation.mutate(property.property_id)
            }}
            disabled={mutation.isPending}
            variant="destructive"
            className="h-10 rounded-xl px-5"
          >
            {mutation.isPending && <Loader2Icon className="animate-spin" />}
            {mutation.isPending ? "Deleting…" : "Delete property"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
