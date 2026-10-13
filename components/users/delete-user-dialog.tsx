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
import { deleteUser, usersKeys } from "@/lib/api/users"
import type { User } from "@/lib/types"

type DeleteUserDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
}: DeleteUserDialogProps) {
  const queryClient = useQueryClient()
  const name = user?.full_name || user?.username
  const mutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usersKeys.all })
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
            <span className="font-medium">{name}</span> will no longer be able
            to log in to MNC People. This action can&apos;t be undone.
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
            {mutation.isPending ? "Deleting…" : "Delete user"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
