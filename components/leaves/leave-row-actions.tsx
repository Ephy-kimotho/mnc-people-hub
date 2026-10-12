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
  onApprove: () => void
  onReject: () => void
  onEdit: () => void
  onRecall: () => void
}

// Only actions that make sense for the request's current status are shown
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
        {pending && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onApprove}>
              <CheckIcon />
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onReject}>
              <XIcon />
              Reject
            </DropdownMenuItem>
          </>
        )}
        {active && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onEdit}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onRecall}>
              <RotateCcwIcon />
              Recall
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
