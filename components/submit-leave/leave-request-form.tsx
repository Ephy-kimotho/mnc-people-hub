"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, InfoIcon } from "lucide-react"
import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"

import { DatePicker } from "@/components/date-picker"
import {
  LeaveSubmitted,
  type SubmittedLeave,
} from "@/components/submit-leave/leave-submitted"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatDayCount } from "@/lib/format"
import { ANNUAL_LEAVE_DAYS, workingDays } from "@/lib/leave"
import {
  REASON_MAX,
  leaveRequestSchema,
  type LeaveRequestValues,
} from "@/lib/schemas/leave"
import type { LeaveType, Staff } from "@/lib/types"

export type StaffOption = Pick<Staff, "id" | "name" | "role"> & {
  leaveTaken: number
}

const defaultValues: LeaveRequestValues = {
  staffId: "",
  type: "annual",
  startDate: "",
  endDate: "",
  reason: "",
}

export function LeaveRequestForm({ staff }: { staff: StaffOption[] }) {
  const [submitted, setSubmitted] = useState<SubmittedLeave>()
  const form = useForm<LeaveRequestValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues,
  })

  const [staffId, startDate, endDate] = useWatch({
    control: form.control,
    name: ["staffId", "startDate", "endDate"],
  })
  const member = staff.find((s) => s.id === staffId)
  const remaining = Math.max(ANNUAL_LEAVE_DAYS - (member?.leaveTaken ?? 0), 0)
  // Live preview of the duration once both dates are picked in order
  const days =
    startDate && endDate && endDate >= startDate
      ? workingDays(startDate, endDate)
      : null

  const leaveTypes: { value: LeaveType; label: string; hint: string }[] = [
    {
      value: "annual",
      label: "Annual Leave",
      hint: member
        ? `${remaining} of ${ANNUAL_LEAVE_DAYS} days left`
        : `Deducted from ${ANNUAL_LEAVE_DAYS} days`,
    },
    { value: "sick", label: "Sick Leave", hint: "Medical reasons" },
    { value: "emergency", label: "Emergency", hint: "Unforeseen events" },
    { value: "unpaid", label: "Unpaid", hint: "No balance left" },
  ]

  function onSubmit(values: LeaveRequestValues) {
    if (!member) return
    const count = workingDays(values.startDate, values.endDate)
    // Annual leave can't exceed what's left of the statutory 21 days
    if (values.type === "annual" && count > remaining) {
      form.setError("endDate", {
        message: `${member.name} only has ${formatDayCount(remaining).toLowerCase()} of annual leave left`,
      })
      return
    }
    setSubmitted({ ...values, name: member.name, days: count })
  }

  if (submitted) {
    return (
      <LeaveSubmitted
        leave={submitted}
        onReset={() => {
          form.reset(defaultValues)
          setSubmitted(undefined)
        }}
      />
    )
  }

  return (
    <Card className="max-w-2xl gap-0 rounded-2xl border-t-4 border-t-brand px-5 py-6 shadow-xs sm:px-10 sm:py-9">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-7"
        noValidate
      >
        <Controller
          name="staffId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-2">
              <FieldLabel htmlFor="leave-staff">Staff Member</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="leave-staff"
                  aria-invalid={fieldState.invalid}
                  className="h-12 w-full rounded-xl px-4 data-[size=default]:h-12"
                >
                  <SelectValue placeholder="Select an employee..." />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                      <span className="text-muted-foreground">· {s.role}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} className="text-xs" />
            </Field>
          )}
        />

        <Controller
          name="type"
          control={form.control}
          render={({ field }) => (
            <Field className="gap-2">
              <FieldLabel id="leave-type-label">Leave Type</FieldLabel>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                aria-labelledby="leave-type-label"
                className="grid grid-cols-2 gap-3"
              >
                {leaveTypes.map((type) => (
                  <label
                    key={type.value}
                    className="flex cursor-pointer flex-col rounded-xl border bg-card px-4 py-3.5 transition-colors hover:bg-muted/50 has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-data-checked:border-brand has-data-checked:bg-brand-soft"
                  >
                    {/* The card itself is the visual control; the radio stays for keyboard and screen readers */}
                    <RadioGroupItem value={type.value} className="sr-only" />
                    <span className="font-heading font-semibold">
                      {type.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {type.hint}
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </Field>
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Controller
            name="startDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-2">
                <FieldLabel htmlFor="leave-start">
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  Start Date
                </FieldLabel>
                <DatePicker
                  id="leave-start"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Pick a start date"
                  invalid={fieldState.invalid}
                  className="h-12 rounded-xl px-4"
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
                <FieldLabel htmlFor="leave-end">
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  End Date
                </FieldLabel>
                <DatePicker
                  id="leave-end"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Pick an end date"
                  invalid={fieldState.invalid}
                  minDate={startDate || undefined}
                  className="h-12 rounded-xl px-4"
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
                <FieldLabel htmlFor="leave-reason">Reason</FieldLabel>
                <span className="text-sm text-muted-foreground">
                  (Optional)
                </span>
              </div>
              <Textarea
                {...field}
                id="leave-reason"
                rows={4}
                maxLength={REASON_MAX}
                placeholder="Brief details about the request..."
                aria-invalid={fieldState.invalid}
                className="min-h-24 rounded-xl px-4 py-3"
              />
              <FieldError errors={[fieldState.error]} className="text-xs" />
            </Field>
          )}
        />

        <div className="flex gap-3 rounded-xl border border-brand/30 bg-brand-soft p-4">
          <InfoIcon className="mt-0.5 size-5 shrink-0" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold">Leave Duration Calculation</p>
            <p className="text-muted-foreground">
              The exact number of days will be calculated automatically by the
              system, taking into account weekends according to standard Kenyan
              HR practices.
            </p>
            {days !== null && (
              <p className="pt-1 font-medium">
                This request covers {formatDayCount(days).toLowerCase()}{" "}
                excluding weekends.
              </p>
            )}
          </div>
        </div>

        <div className="border-t pt-6">
          <Button type="submit" className="h-12 w-full rounded-full">
            Submit Leave Request
          </Button>
        </div>
      </form>
    </Card>
  )
}
