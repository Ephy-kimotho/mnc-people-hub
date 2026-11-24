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
import { deleteUnit, propertyKeys } from "@/lib/api/properties"
import type { PropertyUnit } from "@/lib/types"

export function DeleteUnitDialog({
  open,
  onOpenChange,
  unit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  unit?: PropertyUnit
}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (id: string) => deleteUnit(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success(`${unit?.label ?? "Unit"} has been deleted`)
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(
        getErrorMessage(
          error,
          "Couldn't delete this unit. End its lease first."
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
            Delete {unit?.label}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            The unit is removed from the property. Units with an active lease
            can&apos;t be deleted. This can&apos;t be undone.
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
              if (unit) mutation.mutate(unit.unit_id)
            }}
            disabled={mutation.isPending}
            variant="destructive"
            className="h-10 rounded-xl px-5"
          >
            {mutation.isPending && <Loader2Icon className="animate-spin" />}
            {mutation.isPending ? "Deleting…" : "Delete unit"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
