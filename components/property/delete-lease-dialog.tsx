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
import { deleteLease, propertyKeys } from "@/lib/api/properties"
import type { Lease } from "@/lib/types"

export function DeleteLeaseDialog({
  open,
  onOpenChange,
  lease,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  lease?: Lease
}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (id: string) => deleteLease(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Lease deleted and the unit freed")
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't delete this lease.")),
  })

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => !mutation.isPending && onOpenChange(next)}
    >
      <AlertDialogContent className="rounded-2xl p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">
            Delete this lease?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {lease?.tenant_full_name || lease?.tenant_company_name} ·{" "}
            {lease?.property_alias} {lease?.unit_label}. The unit becomes vacant
            and the lease document is removed. This can&apos;t be undone.
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
              if (lease) mutation.mutate(lease.lease_id)
            }}
            disabled={mutation.isPending}
            variant="destructive"
            className="h-10 rounded-xl px-5"
          >
            {mutation.isPending && <Loader2Icon className="animate-spin" />}
            {mutation.isPending ? "Deleting…" : "Delete lease"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
