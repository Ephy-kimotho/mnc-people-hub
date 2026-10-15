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
import { approveLeaveRequest, leaveKeys } from "@/lib/api/leaves"
import { formatDateRange } from "@/lib/format"
import { durationLabel, leaveTypeLabels } from "@/lib/leave"
import {
  REASON_MAX,
  approveLeaveSchema,
  type ApproveLeaveValues,
} from "@/lib/schemas/leave"
import type { LeaveRequest } from "@/lib/types"

type ApproveLeaveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  request?: LeaveRequest
}

export function ApproveLeaveDialog({
  open,
  onOpenChange,
  request,
}: ApproveLeaveDialogProps) {
  const name = request?.staffName

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 rounded-2xl p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Approve leave for {name}?
          </DialogTitle>
          <DialogDescription>
            This will approve <span className="font-medium">{name}</span>
            &apos;s{" "}
            {request && (
              <>
                {leaveTypeLabels[request.type].toLowerCase()} leave for{" "}
                {formatDateRange(request.startDate, request.endDate)} (
                {durationLabel(request)})
              </>
            )}
            . They&apos;ll be marked as on leave for these dates.
          </DialogDescription>
        </DialogHeader>
        {/* Radix unmounts the content when closed, so the form starts fresh each time */}
        {request && (
          <ApproveLeaveForm
            request={request}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ApproveLeaveForm({
  request,
  onDone,
}: {
  request: LeaveRequest
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const name = request.staffName

  const mutation = useMutation({
    mutationFn: (values: ApproveLeaveValues) =>
      approveLeaveRequest(request.id, values.note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leaveKeys.all })
      toast.success(`Leave approved for ${name}`)
      onDone()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, `Couldn't approve ${name}'s leave.`))
    },
  })

  const form = useForm<ApproveLeaveValues>({
    resolver: zodResolver(approveLeaveSchema),
    defaultValues: { note: "" },
  })

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      className="space-y-5 px-6 py-5"
      noValidate
    >
      <Controller
        name="note"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="gap-2">
            <FieldLabel htmlFor="approve-note">
              Note <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea
              {...field}
              id="approve-note"
              rows={4}
              maxLength={REASON_MAX}
              placeholder="Add a note for this approval..."
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
          disabled={mutation.isPending}
          className="h-11 rounded-xl"
        >
          {mutation.isPending && <Loader2Icon className="animate-spin" />}
          {mutation.isPending ? "Approving…" : "Approve Leave"}
        </Button>
      </div>
    </form>
  )
}
