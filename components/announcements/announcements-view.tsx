"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon, MegaphoneIcon, PlusIcon } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useAnnouncements } from "@/hooks/use-mnc"
import { getErrorMessage } from "@/lib/api/errors"
import {
  createAnnouncement,
  deleteAnnouncement,
  mncKeys,
} from "@/lib/api/mnc"
import { formatDateTime } from "@/lib/format"
import { canReviewLeave } from "@/lib/permissions"
import type { Announcement } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

export function AnnouncementsView() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const query = useAnnouncements()
  const canPost = canReviewLeave(user)
  const canDelete = user?.role === "admin"
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState<Announcement>()

  const remove = useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mncKeys.announcements() })
      toast.success("Announcement deleted")
      setDeleting(undefined)
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't delete it.")),
  })

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Notice board"
        title="Announcements"
        description="Updates for the whole team."
        action={
          canPost && (
            <Button
              className="h-10 self-start rounded-full px-5"
              onClick={() => setOpen(true)}
            >
              <PlusIcon />
              New announcement
            </Button>
          )
        }
      />

      {query.isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(query.error, "Couldn't load announcements.")}
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
          <MegaphoneIcon className="size-5 text-brand-ink" />
          No announcements yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {(query.data ?? []).map((announcement) => (
            <Card key={announcement.announcement_id} className="rounded-2xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-lg font-semibold">
                    {announcement.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {announcement.author_name ?? "MNC"} ·{" "}
                    {formatDateTime(announcement.created_at)}
                  </p>
                </div>
                {canDelete ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-destructive"
                    onClick={() => setDeleting(announcement)}
                  >
                    Delete
                  </Button>
                ) : null}
              </div>
              <p className="mt-4 whitespace-pre-line text-sm">
                {announcement.message}
              </p>
            </Card>
          ))}
        </div>
      )}

      <NewAnnouncementDialog open={open} onOpenChange={setOpen} />

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
              This removes it for everyone. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="-mx-6 -mb-6 px-6">
            <AlertDialogCancel className="h-10 rounded-xl px-5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                if (deleting) remove.mutate(deleting.announcement_id)
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

function NewAnnouncementDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => createAnnouncement({ title, message }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mncKeys.announcements() })
      toast.success("Announcement published")
      setTitle("")
      setMessage("")
      onOpenChange(false)
    },
    onError: (err) =>
      setError(getErrorMessage(err, "Couldn't publish the announcement.")),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            New announcement
          </DialogTitle>
          <DialogDescription>
            Everyone signed in will see this on the notice board.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            setError(null)
            if (title.trim().length < 2) {
              setError("Enter a title.")
              return
            }
            if (message.trim().length < 2) {
              setError("Enter the message.")
              return
            }
            mutation.mutate()
          }}
          noValidate
        >
          <fieldset disabled={mutation.isPending} className="grid gap-4 px-6 py-5">
            <div className="grid gap-2">
              <FieldLabel htmlFor="announcement-title">Title</FieldLabel>
              <Input
                id="announcement-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Office closed on Friday"
                className="h-11 rounded-xl px-3.5"
              />
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="announcement-message">Message</FieldLabel>
              <Textarea
                id="announcement-message"
                rows={5}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </div>
            <FieldError>{error}</FieldError>
          </fieldset>
          <DialogFooter className="border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl px-5"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 rounded-xl px-5"
              disabled={mutation.isPending}
            >
              {mutation.isPending && <Loader2Icon className="animate-spin" />}
              Publish
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
