"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import toast from "react-hot-toast"

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
import { getErrorMessage } from "@/lib/api/errors"
import { leaveKeys, recallLeaveRequest } from "@/lib/api/leaves"
import {
  REASON_MAX,
  recallLeaveSchema,
  type RecallLeaveValues,
} from "@/lib/schemas/leave"
import type { LeaveRequest } from "@/lib/types"

type RecallLeaveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  request?: LeaveRequest
}

export function RecallLeaveDialog({
  open,
  onOpenChange,
  request,
}: RecallLeaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 rounded-2xl p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Recall this leave request for {request?.staffName}?
          </DialogTitle>
          <DialogDescription>
            This will mark it as recalled and return any leave days used.
          </DialogDescription>
        </DialogHeader>
        {/* Radix unmounts the content when closed, so the form starts fresh each time */}
        {request && (
          <RecallLeaveForm
            request={request}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function RecallLeaveForm({
  request,
  onDone,
}: {
  request: LeaveRequest
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const name = request.staffName

  const mutation = useMutation({
    mutationFn: (values: RecallLeaveValues) =>
      recallLeaveRequest(request.id, values.reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leaveKeys.all })
      toast.success(`Leave recalled for ${name}`)
      onDone()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, `Couldn't recall ${name}'s leave.`))
    },
  })

  const form = useForm<RecallLeaveValues>({
    resolver: zodResolver(recallLeaveSchema),
    defaultValues: { reason: "" },
  })

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      className="space-y-5 px-6 py-5"
      noValidate
    >
      <Controller
        name="reason"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="gap-2">
            <FieldLabel htmlFor="recall-reason">
              Recall Reason <span className="text-destructive">*</span>
            </FieldLabel>
            <Textarea
              {...field}
              id="recall-reason"
              rows={4}
              maxLength={REASON_MAX}
              placeholder="Write the reason for recalling this leave..."
              aria-invalid={fieldState.invalid}
              className="min-h-24 rounded-xl px-3.5 py-3"
            />
            <FieldError errors={[fieldState.error]} className="text-xs" />
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-3 pt-1">
        <DialogClose asChild>
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending}
            className="h-11 rounded-xl"
          >
            Cancel
          </Button>
        </DialogClose>
        <Button
          type="submit"
          variant="destructive"
          disabled={mutation.isPending}
          className="h-11 rounded-xl"
        >
          {mutation.isPending && <Loader2Icon className="animate-spin" />}
          {mutation.isPending ? "Recalling…" : "Recall Leave"}
        </Button>
      </div>
    </form>
  )
}
