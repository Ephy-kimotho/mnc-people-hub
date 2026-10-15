import { axiosInstance } from "@/lib/axios"
import { hoursBetween, leaveTypeLabels } from "@/lib/leave"
import type { LeaveRequestValues } from "@/lib/schemas/leave"
import type {
  LeaveBalanceRecord,
  LeaveFilters,
  LeaveRecord,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
} from "@/lib/types"

// Every leave query shares this prefix, so one invalidation refreshes them all.
// Balances live here too so approving or recalling leave refreshes them.
export const leaveKeys = {
  all: ["leaves"] as const,
  list: (filters: LeaveFilters) => ["leaves", "list", filters] as const,
  balances: (staffId: string) => ["leaves", "balances", staffId] as const,
}

// Types and statuses are lowercased since the API writes "Annual" but
// filters on "annual". Times drop their seconds to match the form's "HH:mm".
function toLeaveRequest(record: LeaveRecord): LeaveRequest {
  const status = record.status.toLowerCase() as LeaveStatus
  return {
    id: record.request_id,
    staffId: record.staff_id,
    staffName: record.staff_name,
    staffRole: record.staff_role,
    type: record.leave_type.toLowerCase() as LeaveType,
    status,
    startDate: record.start_date,
    endDate: record.end_date,
    days: record.days,
    durationType: record.duration_type,
    halfDayPeriod: record.half_day_period ?? undefined,
    durationHours: record.duration_hours ?? undefined,
    startTime: record.start_time?.slice(0, 5),
    endTime: record.end_time?.slice(0, 5),
    reason: record.reason ?? undefined,
    rejectionReason:
      status === "rejected" ? (record.review_note ?? undefined) : undefined,
    createdAt: record.created_at,
  }
}

// An empty list means the staff member hasn't used any leave yet
export async function fetchLeaveBalances(staffId: string) {
  const response = await axiosInstance.get<LeaveBalanceRecord[]>(
    `/staff/staff/${staffId}/leave-balance`
  )
  return response.data
}

export async function fetchLeaveRequests(filters: LeaveFilters) {
  const response = await axiosInstance.get<LeaveRecord[]>("/leave/leaves", {
    params: filters,
  })
  return response.data.map(toLeaveRequest)
}

// The API wants the leave type's label ("Annual"), "HH:mm:ss" times and only
// the fields that match the duration type. Half days and hours end on the
// start date, and hourly leave sends the hours between the two times.
export async function createLeaveRequest(values: LeaveRequestValues) {
  const { durationType } = values
  await axiosInstance.post("/leave/leaves", {
    staff_id: values.staffId,
    leave_type: leaveTypeLabels[values.type],
    start_date: values.startDate,
    end_date: durationType === "full_day" ? values.endDate : values.startDate,
    duration_type: durationType,
    half_day_period:
      durationType === "half_day" ? values.halfDayPeriod : undefined,
    duration_hours:
      durationType === "hours"
        ? hoursBetween(values.startTime, values.endTime)
        : undefined,
    start_time: `${values.startTime}:00`,
    end_time: `${values.endTime}:00`,
    reason: values.reason || undefined,
  })
}

// The approval note is optional, so an empty one is left off
export async function approveLeaveRequest(requestId: string, note: string) {
  await axiosInstance.post(`/leave/leaves/${requestId}/approve`, {
    note: note || undefined,
  })
}

// The API stores the rejection reason as the request's review note
export async function rejectLeaveRequest(requestId: string, note: string) {
  await axiosInstance.post(`/leave/leaves/${requestId}/reject`, { note })
}

export async function recallLeaveRequest(requestId: string, reason: string) {
  await axiosInstance.post(`/leave/leaves/${requestId}/recall`, { reason })
}
