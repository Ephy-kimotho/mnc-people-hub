"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"

import { DatePicker } from "@/components/date-picker"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { halfDayTimes, leaveTypeLabels } from "@/lib/leave"
import {
  REASON_MAX,
  leaveRequestSchema,
  type LeaveRequestValues,
} from "@/lib/schemas/leave"
import type { LeaveRequest, LeaveType } from "@/lib/types"
import { cn } from "@/lib/utils"

type EditLeaveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  request?: LeaveRequest
  name?: string
  onSave: (values: LeaveRequestValues) => void
}

const inputClass = "h-12 rounded-xl px-3.5"

export function EditLeaveDialog({
  open,
  onOpenChange,
  request,
  name,
  onSave,
}: EditLeaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 rounded-2xl p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Edit Leave Request
          </DialogTitle>
          <DialogDescription>
            Update the leave details for {name}.
          </DialogDescription>
        </DialogHeader>
        {/* Radix unmounts the content when closed, so the form refills each time */}
        {request && <EditLeaveForm request={request} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  )
}

function EditLeaveForm({
  request,
  onSave,
}: {
  request: LeaveRequest
  onSave: (values: LeaveRequestValues) => void
}) {
  const form = useForm<LeaveRequestValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      staffId: request.staffId,
      type: request.type,
      // Not editable here, but the schema checks them against the dates
      durationType: request.durationType,
      halfDayPeriod: request.halfDayPeriod ?? "AM",
      startDate: request.startDate,
      endDate: request.endDate,
      startTime: request.startTime ?? halfDayTimes.AM.startTime,
      endTime: request.endTime ?? halfDayTimes.PM.endTime,
      reason: request.reason ?? "",
    },
  })
  const startDate = useWatch({ control: form.control, name: "startDate" })

  return (
    <form
      onSubmit={form.handleSubmit(onSave)}
      className="space-y-5 px-6 py-5"
      noValidate
    >
      <Controller
        name="type"
        control={form.control}
        render={({ field }) => (
          <Field className="gap-2">
            <FieldLabel htmlFor="edit-leave-type">Leave Type</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="edit-leave-type"
                className={cn("w-full data-[size=default]:h-12", inputClass)}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(leaveTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value as LeaveType}>
                    {label} Leave
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      />

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
        <Controller
          name="startDate"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-2">
              <FieldLabel htmlFor="edit-leave-start">Start Date</FieldLabel>
              <DatePicker
                id="edit-leave-start"
                value={field.value}
                onChange={field.onChange}
                placeholder="Pick a start date"
                invalid={fieldState.invalid}
                className={inputClass}
              />
              <FieldError errors={[fieldState.error]} className="text-xs" />
            </Field>
          )}
        />
        <Controller
          name="endDate"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-2">
              <FieldLabel htmlFor="edit-leave-end">End Date</FieldLabel>
              <DatePicker
                id="edit-leave-end"
                value={field.value}
                onChange={field.onChange}
                placeholder="Pick an end date"
                invalid={fieldState.invalid}
                minDate={startDate || undefined}
                className={inputClass}
              />
              <FieldError errors={[fieldState.error]} className="text-xs" />
            </Field>
          )}
        />
      </div>

      <Controller
        name="reason"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="gap-2">
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="edit-leave-reason">Reason</FieldLabel>
              <span className="text-sm text-muted-foreground">(Optional)</span>
            </div>
            <Textarea
              {...field}
              id="edit-leave-reason"
              rows={3}
              maxLength={REASON_MAX}
              placeholder="Write your reason here...."
              aria-invalid={fieldState.invalid}
              className="min-h-20 rounded-xl px-3.5 py-3"
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
        <Button type="submit" className="h-11 rounded-xl">
          Save Changes
        </Button>
      </div>
    </form>
  )
}
