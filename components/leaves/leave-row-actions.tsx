"use client"

import {
  CheckIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react"

import { AddToCalendarSub } from "@/components/leave/add-to-calendar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { CalendarEvent } from "@/lib/calendar"
import type { LeaveStatus } from "@/lib/types"

type LeaveRowActionsProps = {
  name: string
  status: LeaveStatus
  event: CalendarEvent
  // Actions the user isn't allowed to take are left out
  onApprove?: () => void
  onReject?: () => void
  onEdit: () => void
  onRecall?: () => void
}

// Only actions the user may take, and that suit the request's status, show
export function LeaveRowActions({
  name,
  status,
  event,
  onApprove,
  onReject,
  onEdit,
  onRecall,
}: LeaveRowActionsProps) {
  const pending = status === "pending"
  const active = pending || status === "approved"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${name}`}>
          <EllipsisVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <AddToCalendarSub event={event} />
        {pending && (onApprove || onReject) && (
          <>
            <DropdownMenuSeparator />
            {onApprove && (
              <DropdownMenuItem onSelect={onApprove}>
                <CheckIcon />
                Approve
              </DropdownMenuItem>
            )}
            {onReject && (
              <DropdownMenuItem onSelect={onReject}>
                <XIcon />
                Reject
              </DropdownMenuItem>
            )}
          </>
        )}
        {active && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onEdit}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            {onRecall && (
              <DropdownMenuItem variant="destructive" onSelect={onRecall}>
                <RotateCcwIcon />
                Recall
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
