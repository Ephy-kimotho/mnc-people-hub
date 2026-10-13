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
import { changeUserAccess, usersKeys } from "@/lib/api/users"
import type { User } from "@/lib/types"

type DisableUserDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User
}

export function DisableUserDialog({
  open,
  onOpenChange,
  user,
}: DisableUserDialogProps) {
  const queryClient = useQueryClient()
  const name = user?.full_name || user?.username
  const mutation = useMutation({
    mutationFn: (userId: string) => changeUserAccess(userId, "disable"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usersKeys.all })
      toast.success(`${name} has been disabled`)
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, `Couldn't disable ${name}.`))
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
            Disable {name}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium">{name}</span> won&apos;t be able to
            log in or access MNC People until their account is enabled again.
            You can enable it at any time from this page.
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
              if (user) mutation.mutate(user.user_id)
            }}
            disabled={mutation.isPending}
            variant="destructive"
            className="h-10 rounded-xl px-5"
          >
            {mutation.isPending && <Loader2Icon className="animate-spin" />}
            {mutation.isPending ? "Disabling…" : "Disable user"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
