import { z } from "zod"

import { WORKDAY_HOURS, hoursBetween, workingDays } from "@/lib/leave"
import type { DurationType, HalfDayPeriod, LeaveType } from "@/lib/types"

export const REASON_MAX = 500

const leaveTypes = [
  "annual",
  "sick",
  "emergency",
  "unpaid",
] as const satisfies readonly LeaveType[]

const durationTypes = [
  "full_day",
  "half_day",
  "hours",
] as const satisfies readonly DurationType[]

const halfDayPeriods = ["AM", "PM"] as const satisfies readonly HalfDayPeriod[]

// Half days and hours fall on the start date alone, so the end date is only
// checked for full days. Hourly leave takes its hours from the two times.
export const leaveRequestSchema = z
  .object({
    staffId: z.string().min(1, "Select an employee"),
    type: z.enum(leaveTypes),
    durationType: z.enum(durationTypes),
    halfDayPeriod: z.enum(halfDayPeriods),
    startDate: z.iso.date("Pick a start date"),
    endDate: z.string(),
    startTime: z.iso.time({ precision: -1, error: "Pick a start time" }),
    endTime: z.iso.time({ precision: -1, error: "Pick an end time" }),
    reason: z
      .string()
      .trim()
      .max(REASON_MAX, `Keep it under ${REASON_MAX} characters`),
  })
  .superRefine((v, ctx) => {
    // "HH:mm" times compare correctly as strings, as do ISO dates
    const singleDay = v.durationType !== "full_day" || v.endDate === v.startDate
    if (singleDay && v.endTime <= v.startTime) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be after the start time",
      })
    } else if (v.durationType === "hours") {
      const hours = hoursBetween(v.startTime, v.endTime)
      if (hours < 0.5 || hours > WORKDAY_HOURS) {
        ctx.addIssue({
          code: "custom",
          path: ["endTime"],
          message: `Hourly leave must be between 30 minutes and ${WORKDAY_HOURS} hours`,
        })
      }
    }

    if (v.durationType !== "full_day") {
      if (workingDays(v.startDate, v.startDate) === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["startDate"],
          message: "Pick a weekday",
        })
      }
      return
    }

    if (!z.iso.date().safeParse(v.endDate).success) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "Pick an end date",
      })
    } else if (v.endDate < v.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date can't be before the start date",
      })
    } else if (workingDays(v.startDate, v.endDate) === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "These dates only cover a weekend",
      })
    }
  })

export type LeaveRequestValues = z.infer<typeof leaveRequestSchema>

export const approveLeaveSchema = z.object({
  note: z
    .string()
    .trim()
    .max(REASON_MAX, `Keep it under ${REASON_MAX} characters`),
})

export type ApproveLeaveValues = z.infer<typeof approveLeaveSchema>

export const rejectLeaveSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Add a reason for rejecting this request")
    .max(REASON_MAX, `Keep it under ${REASON_MAX} characters`),
})

export type RejectLeaveValues = z.infer<typeof rejectLeaveSchema>

export const recallLeaveSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Add a reason for recalling this leave")
    .max(REASON_MAX, `Keep it under ${REASON_MAX} characters`),
})

export type RecallLeaveValues = z.infer<typeof recallLeaveSchema>
