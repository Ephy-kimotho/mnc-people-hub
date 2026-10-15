"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { getYear } from "date-fns"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarIcon, ClockIcon, InfoIcon } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
import toast from "react-hot-toast"

import { DatePicker } from "@/components/date-picker"
import { TimePicker } from "@/components/time-picker"
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
import { useLeaveRequests } from "@/hooks/use-leave-requests"
import { useStaff } from "@/hooks/use-staff"
import { getErrorMessage } from "@/lib/api/errors"
import { createLeaveRequest, leaveKeys } from "@/lib/api/leaves"
import { formatDayCount } from "@/lib/format"
import {
  ANNUAL_LEAVE_DAYS,
  WORKDAY_HOURS,
  annualLeaveTaken,
  durationTypeLabels,
  halfDayPeriodLabels,
  halfDayTimes,
  hoursBetween,
  leaveDays,
} from "@/lib/leave"
import {
  REASON_MAX,
  leaveRequestSchema,
  type LeaveRequestValues,
} from "@/lib/schemas/leave"
import type { DurationType, HalfDayPeriod, LeaveType } from "@/lib/types"

const defaultValues: LeaveRequestValues = {
  staffId: "",
  type: "annual",
  durationType: "full_day",
  halfDayPeriod: "AM",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  reason: "",
}

const durationHints: Record<DurationType, string> = {
  full_day: "Whole working days",
  half_day: "Morning or afternoon",
  hours: `Up to ${WORKDAY_HOURS} hours, from the times`,
}

// Selectable card used by every radio group on the form
const optionCard =
  "flex cursor-pointer flex-col rounded-xl border bg-card px-4 py-3.5 transition-colors hover:bg-muted/50 has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-data-checked:border-brand has-data-checked:bg-brand-soft"

export function LeaveRequestForm({
  staffId: initialStaffId = "",
}: {
  staffId?: string
}) {
  const queryClient = useQueryClient()
  const staffQuery = useStaff()
  const staff = (staffQuery.data ?? []).toSorted((a, b) =>
    a.full_name.localeCompare(b.full_name)
  )
  // A staff member passed in stays picked after each submit
  const initialValues = { ...defaultValues, staffId: initialStaffId }
  const form = useForm<LeaveRequestValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: initialValues,
  })

  const [staffId, durationType, startDate, endDate, startTime, endTime] =
    useWatch({
      control: form.control,
      name: [
        "staffId",
        "durationType",
        "startDate",
        "endDate",
        "startTime",
        "endTime",
      ],
    })
  const isFullDay = durationType === "full_day"
  const member = staff.find((s) => s.staff_id === staffId)
  // This year's requests for the picked staff member, for their annual balance
  const historyQuery = useLeaveRequests(
    { staff_id: staffId, year: getYear(new Date()) },
    { enabled: Boolean(staffId) }
  )
  const leaveTaken = member
    ? annualLeaveTaken(historyQuery.data ?? [], staffId)
    : 0
  const remaining = Math.max(ANNUAL_LEAVE_DAYS - leaveTaken, 0)
  // Live preview of the days used once the duration is filled in
  const hours = startTime && endTime ? hoursBetween(startTime, endTime) : 0
  const days =
    durationType === "half_day" ||
    (durationType === "hours" && hours > 0 && hours <= WORKDAY_HOURS) ||
    (isFullDay && startDate && endDate && endDate >= startDate)
      ? leaveDays({ durationType, startDate, endDate, startTime, endTime })
      : null
  const preview =
    durationType === "half_day"
      ? "half a day"
      : durationType === "hours"
        ? `${hours} ${hours === 1 ? "hour" : "hours"}`
        : formatDayCount(days ?? 0).toLowerCase()

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

  const mutation = useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: leaveKeys.all })
      const name = staff.find((s) => s.staff_id === values.staffId)?.full_name
      toast.success(`Leave request submitted for ${name}`)
      form.reset(initialValues)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Couldn't submit this leave request."))
    },
  })

  // Fills the start and end times for the chosen half of the day
  function fillHalfDayTimes(period: HalfDayPeriod) {
    const { startTime, endTime } = halfDayTimes[period]
    form.setValue("startTime", startTime, { shouldValidate: true })
    form.setValue("endTime", endTime, { shouldValidate: true })
  }

  function onSubmit(values: LeaveRequestValues) {
    if (!member) return
    const count = leaveDays(values)
    // Annual leave can't exceed what's left of the statutory 21 days
    if (values.type === "annual" && count > remaining) {
      form.setError(isFullDay ? "endDate" : "startDate", {
        message: `${member.full_name} only has ${formatDayCount(remaining).toLowerCase()} of annual leave left`,
      })
      return
    }
    mutation.mutate(values)
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
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={staffQuery.isPending || staffQuery.isError}
              >
                <SelectTrigger
                  id="leave-staff"
                  aria-invalid={fieldState.invalid}
                  className="h-12 w-full rounded-xl px-4 data-[size=default]:h-12"
                >
                  <SelectValue
                    placeholder={
                      staffQuery.isPending
                        ? "Loading staff..."
                        : staffQuery.isError
                          ? "Couldn't load staff"
                          : "Select an employee..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.staff_id} value={s.staff_id}>
                      {s.full_name}
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
                  <label key={type.value} className={optionCard}>
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

        <Controller
          name="durationType"
          control={form.control}
          render={({ field }) => (
            <Field className="gap-2">
              <FieldLabel id="leave-duration-label">Duration</FieldLabel>
              <RadioGroup
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value)
                  if (value === "half_day") {
                    fillHalfDayTimes(form.getValues("halfDayPeriod"))
                  }
                }}
                aria-labelledby="leave-duration-label"
                className="grid gap-3 sm:grid-cols-3"
              >
                {(Object.keys(durationHints) as DurationType[]).map((value) => (
                  <label key={value} className={optionCard}>
                    <RadioGroupItem value={value} className="sr-only" />
                    <span className="font-heading font-semibold">
                      {durationTypeLabels[value]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {durationHints[value]}
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
                {/* Half days and hours end on the start date, shown here read-only */}
                <DatePicker
                  id="leave-end"
                  value={isFullDay ? field.value : startDate}
                  onChange={field.onChange}
                  placeholder={isFullDay ? "Pick an end date" : "Same as start"}
                  invalid={fieldState.invalid}
                  disabled={!isFullDay}
                  minDate={startDate || undefined}
                  className="h-12 rounded-xl px-4"
                />
                <FieldError errors={[fieldState.error]} className="text-xs" />
              </Field>
            )}
          />
        </div>

        {durationType === "half_day" && (
          <Controller
            name="halfDayPeriod"
            control={form.control}
            render={({ field }) => (
              <Field className="gap-2">
                <FieldLabel id="leave-period-label">Half of the Day</FieldLabel>
                <RadioGroup
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)
                    fillHalfDayTimes(value as HalfDayPeriod)
                  }}
                  aria-labelledby="leave-period-label"
                  className="grid grid-cols-2 gap-3"
                >
                  {(["AM", "PM"] as HalfDayPeriod[]).map((value) => (
                    <label key={value} className={optionCard}>
                      <RadioGroupItem value={value} className="sr-only" />
                      <span className="font-heading font-semibold">
                        {halfDayPeriodLabels[value]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {halfDayTimes[value].startTime} –{" "}
                        {halfDayTimes[value].endTime}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </Field>
            )}
          />
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Controller
            name="startTime"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-2">
                <FieldLabel htmlFor="leave-start-time">
                  <ClockIcon className="size-4 text-muted-foreground" />
                  Start Time
                </FieldLabel>
                <TimePicker
                  id="leave-start-time"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={fieldState.invalid}
                  className="h-12 rounded-xl px-4"
                />
                <FieldError errors={[fieldState.error]} className="text-xs" />
              </Field>
            )}
          />
          <Controller
            name="endTime"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-2">
                <FieldLabel htmlFor="leave-end-time">
                  <ClockIcon className="size-4 text-muted-foreground" />
                  End Time
                </FieldLabel>
                <TimePicker
                  id="leave-end-time"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={fieldState.invalid}
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
                {isFullDay
                  ? `This request covers ${preview} excluding weekends.`
                  : `This request covers ${preview} (${formatDayCount(days).toLowerCase()}).`}
              </p>
            )}
          </div>
        </div>

        <div className="border-t pt-6">
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="h-12 w-full rounded-full"
          >
            {mutation.isPending ? "Submitting..." : "Submit Leave Request"}
          </Button>
        </div>
      </form>
    </Card>
  )
}
