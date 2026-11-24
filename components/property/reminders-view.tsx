"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { BellIcon, CheckIcon, Loader2Icon, PlusIcon } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import { Skeleton } from "@/components/ui/skeleton"
import { ReminderDialog } from "@/components/property/reminder-dialog"
import { useReminders } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import {
  completeReminder,
  deleteReminder,
  propertyKeys,
} from "@/lib/api/properties"
import { formatDate } from "@/lib/format"
import { canManageProperty } from "@/lib/permissions"
import type { Reminder } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

const severityTone: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-brand-soft text-brand-ink",
  high: "bg-warning/15 text-warning",
  critical: "bg-destructive/10 text-destructive",
}

export function RemindersView() {
  const { user } = useAuth()
  const canManage = canManageProperty(user)
  const query = useReminders({})
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState<Reminder>()

  const complete = useMutation({
    mutationFn: (id: string) => completeReminder(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Reminder completed")
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't complete it.")),
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteReminder(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Reminder deleted")
      setDeleting(undefined)
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't delete it.")),
  })

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Follow-ups"
        title="Reminders"
        description="Rent, deposits, documents and anything else needing attention."
        action={
          canManage && (
            <Button
              className="h-10 self-start rounded-full px-5"
              onClick={() => setOpen(true)}
            >
              <PlusIcon />
              Add reminder
            </Button>
          )
        }
      />

      {query.isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(query.error, "Couldn't load reminders.")}
          </p>
          <Button
            variant="outline"
            className="h-10 rounded-full px-5"
            onClick={() => query.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : (query.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          <BellIcon className="size-5 text-brand-ink" />
          Nothing outstanding.
        </div>
      ) : (
        <Card className="gap-0 rounded-2xl p-0">
          <ul className="divide-y">
            {(query.data ?? []).map((reminder) => (
              <li
                key={reminder.reminder_id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{reminder.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {reminder.kind} ·{" "}
                    {reminder.due_on ? formatDate(reminder.due_on) : "No date"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${severityTone[reminder.severity] ?? "bg-muted"}`}
                  >
                    {reminder.severity}
                  </span>
                  {canManage ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                        disabled={complete.isPending}
                        onClick={() => complete.mutate(reminder.reminder_id)}
                      >
                        {complete.isPending ? (
                          <Loader2Icon className="animate-spin" />
                        ) : (
                          <CheckIcon />
                        )}
                        Complete
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-destructive"
                        onClick={() => setDeleting(reminder)}
                      >
                        Delete
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ReminderDialog open={open} onOpenChange={setOpen} />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(undefined)}
      >
        <AlertDialogContent className="rounded-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              Delete {deleting?.title}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="-mx-6 -mb-6 px-6">
            <AlertDialogCancel className="h-10 rounded-xl px-5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                if (deleting) remove.mutate(deleting.reminder_id)
              }}
              disabled={remove.isPending}
              variant="destructive"
              className="h-10 rounded-xl px-5"
            >
              {remove.isPending && <Loader2Icon className="animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
