import { z } from "zod"

import { workingDays } from "@/lib/leave"
import type { LeaveType } from "@/lib/types"

export const REASON_MAX = 500

const leaveTypes = [
  "annual",
  "sick",
  "emergency",
  "unpaid",
] as const satisfies readonly LeaveType[]

export const leaveRequestSchema = z
  .object({
    staffId: z.string().min(1, "Select an employee"),
    type: z.enum(leaveTypes),
    startDate: z.iso.date("Pick a start date"),
    endDate: z.iso.date("Pick an end date"),
    reason: z
      .string()
      .trim()
      .max(REASON_MAX, `Keep it under ${REASON_MAX} characters`),
  })
  // ISO dates compare correctly as strings
  .refine((v) => v.endDate >= v.startDate, {
    path: ["endDate"],
    error: "End date can't be before the start date",
  })
  .refine((v) => workingDays(v.startDate, v.endDate) > 0, {
    path: ["endDate"],
    error: "These dates only cover a weekend",
  })

export type LeaveRequestValues = z.infer<typeof leaveRequestSchema>

export const rejectLeaveSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Add a reason for rejecting this request")
    .max(REASON_MAX, `Keep it under ${REASON_MAX} characters`),
})

export type RejectLeaveValues = z.infer<typeof rejectLeaveSchema>
