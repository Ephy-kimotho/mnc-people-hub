"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  EllipsisVerticalIcon,
  KeyRoundIcon,
  Loader2Icon,
  LockOpenIcon,
  Trash2Icon,
  UserCheckIcon,
  UserXIcon,
} from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getErrorMessage } from "@/lib/api/errors"
import {
  changeUserAccess,
  resetUserPassword,
  usersKeys,
  type UserAccessAction,
} from "@/lib/api/users"
import type { User } from "@/lib/types"

// Disabling is confirmed in a dialog first, so only these run straight away
type DirectAction = Exclude<UserAccessAction, "disable">

// Wording for each action's toasts, e.g. "Paul Imwene has been unlocked"
const actionText: Record<DirectAction, { done: string; verb: string }> = {
  enable: { done: "enabled", verb: "enable" },
  unlock: { done: "unlocked", verb: "unlock" },
}

type UserRowActionsProps = {
  user: User
  onDisable: () => void
  onDelete: () => void
}

export function UserRowActions({
  user,
  onDisable,
  onDelete,
}: UserRowActionsProps) {
  const queryClient = useQueryClient()
  const name = user.full_name || user.username
  const [resetOpen, setResetOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (action: DirectAction) =>
      changeUserAccess(user.user_id, action),
    onSuccess: (_data, action) => {
      void queryClient.invalidateQueries({ queryKey: usersKeys.all })
      toast.success(`${name} has been ${actionText[action].done}`)
    },
    onError: (error, action) => {
      toast.error(
        getErrorMessage(error, `Couldn't ${actionText[action].verb} ${name}.`)
      )
    },
  })

  const reset = useMutation({
    mutationFn: () => resetUserPassword(user.user_id, password),
    onSuccess: () => {
      toast.success(`${name}'s password has been reset`)
      setPassword("")
      setResetOpen(false)
    },
    onError: (err) =>
      setError(getErrorMessage(err, "Couldn't reset the password.")),
  })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${name}`}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <EllipsisVerticalIcon />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          {user.is_locked && (
            <DropdownMenuItem onSelect={() => mutation.mutate("unlock")}>
              <LockOpenIcon />
              Unlock user
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setResetOpen(true)}>
            <KeyRoundIcon />
            Reset password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.active ? (
            <DropdownMenuItem onSelect={onDisable}>
              <UserXIcon />
              Disable user
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => mutation.mutate("enable")}>
              <UserCheckIcon />
              Enable user
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2Icon />
            Delete user
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="gap-0 p-0">
          <DialogHeader className="gap-1 border-b px-6 py-5">
            <DialogTitle className="text-lg font-semibold">
              Reset {name}&apos;s password
            </DialogTitle>
            <DialogDescription>
              Set a temporary password. They will be asked to change it at the
              next sign-in.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              setError(null)
              if (password.length < 8) {
                setError("Use at least 8 characters.")
                return
              }
              reset.mutate()
            }}
            noValidate
          >
            <fieldset disabled={reset.isPending} className="grid gap-2 px-6 py-5">
              <FieldLabel htmlFor={`reset-${user.user_id}`}>
                New password
              </FieldLabel>
              <Input
                id={`reset-${user.user_id}`}
                type="text"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="h-11 rounded-xl px-3.5 font-mono"
              />
              <FieldError>{error}</FieldError>
            </fieldset>
            <DialogFooter className="border-t px-6 py-4">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl px-5"
                onClick={() => setResetOpen(false)}
                disabled={reset.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-10 rounded-xl px-5"
                disabled={reset.isPending}
              >
                {reset.isPending && <Loader2Icon className="animate-spin" />}
                Reset password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
