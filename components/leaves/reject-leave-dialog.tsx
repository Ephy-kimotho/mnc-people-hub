"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import {
  REASON_MAX,
  rejectLeaveSchema,
  type RejectLeaveValues,
} from "@/lib/schemas/leave"

type RejectLeaveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  name?: string
  onReject: (reason: string) => void
}

export function RejectLeaveDialog({
  open,
  onOpenChange,
  name,
  onReject,
}: RejectLeaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 rounded-2xl p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Reject leave request for {name}?
          </DialogTitle>
          <DialogDescription>
            Let them know why this request can&apos;t be approved.
          </DialogDescription>
        </DialogHeader>
        {/* Radix unmounts the content when closed, so the form starts fresh each time */}
        <RejectLeaveForm onReject={onReject} />
      </DialogContent>
    </Dialog>
  )
}

function RejectLeaveForm({
  onReject,
}: Pick<RejectLeaveDialogProps, "onReject">) {
  const form = useForm<RejectLeaveValues>({
    resolver: zodResolver(rejectLeaveSchema),
    defaultValues: { reason: "" },
  })

  return (
    <form
      onSubmit={form.handleSubmit((values) => onReject(values.reason))}
      className="space-y-5 px-6 py-5"
      noValidate
    >
      <Controller
        name="reason"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="gap-2">
            <FieldLabel htmlFor="reject-reason">
              Rejection Reason <span className="text-destructive">*</span>
            </FieldLabel>
            <Textarea
              {...field}
              id="reject-reason"
              rows={4}
              maxLength={REASON_MAX}
              placeholder="Write the reason for rejecting this request..."
              aria-invalid={fieldState.invalid}
              className="min-h-24 rounded-xl px-3.5 py-3"
            />
            <FieldError errors={[fieldState.error]} className="text-xs" />
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-3 pt-1">
        <DialogClose asChild>
          <Button type="button" variant="outline" className="h-11 rounded-xl">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" variant="destructive" className="h-11 rounded-xl">
          Reject Request
        </Button>
      </div>
    </form>
  )
}
