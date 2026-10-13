"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  EllipsisVerticalIcon,
  Loader2Icon,
  LockOpenIcon,
  Trash2Icon,
  UserCheckIcon,
  UserXIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getErrorMessage } from "@/lib/api/errors"
import {
  changeUserAccess,
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

  return (
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
  )
}
