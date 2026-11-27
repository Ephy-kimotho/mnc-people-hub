import { axiosInstance } from "@/lib/axios"
import { hoursBetween, leaveTypeLabels } from "@/lib/leave"
import type { LeaveRequestValues } from "@/lib/schemas/leave"
import type {
  CalendarLeave,
  LeaveBalanceRecord,
  LeaveFilters,
  LeavePolicy,
  LeaveRecord,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
} from "@/lib/types"

// Every leave query shares this prefix, so one invalidation refreshes them all.
// Balances live here too so approving or recalling leave refreshes them.
export const leaveKeys = {
  all: ["leaves"] as const,
  policies: ["leaves", "policies"] as const,
  calendar: (start: string, end: string) =>
    ["leaves", "calendar", start, end] as const,
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
    hasDocument: record.has_document ?? Boolean(record.document_name),
    documentName: record.document_name ?? undefined,
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
function leavePayload(values: LeaveRequestValues) {
  const { durationType } = values
  return {
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
    start_time:
      durationType === "full_day" ? undefined : `${values.startTime}:00`,
    end_time:
      durationType === "full_day" ? undefined : `${values.endTime}:00`,
    // An explicit null clears a reason when editing
    reason: values.reason || null,
  }
}

export async function createLeaveRequest(values: LeaveRequestValues) {
  const response = await axiosInstance.post<LeaveRecord>(
    "/leave/leaves",
    leavePayload(values)
  )
  return response.data
}

export async function updateLeaveRequest(
  requestId: string,
  values: LeaveRequestValues
) {
  const response = await axiosInstance.patch<LeaveRecord>(
    `/leave/leaves/${requestId}`,
    leavePayload(values)
  )
  return response.data
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

// Supporting documents (e.g. a sick note). Files are served through
// short-lived signed URLs, never a public bucket URL.
export async function uploadLeaveDocument(requestId: string, file: File) {
  const body = new FormData()
  body.append("file", file)
  const response = await axiosInstance.post<{
    filename: string
    uploaded: boolean
  }>(`/leave/leaves/${requestId}/document`, body)
  return response.data
}

export async function fetchLeaveDocumentUrl(requestId: string) {
  const response = await axiosInstance.get<{
    url: string
    expires_in: number | null
    filename: string | null
  }>(`/leave/leaves/${requestId}/document`)
  return response.data
}

export async function deleteLeaveDocument(requestId: string) {
  await axiosInstance.delete(`/leave/leaves/${requestId}/document`)
}


export async function fetchLeavePolicies() {
  const response = await axiosInstance.get<LeavePolicy[]>("/leave/policies")
  return response.data
}

export async function updateLeavePolicy(
  policyId: string,
  values: {
    entitlement_days?: number
    carry_over?: boolean
    requires_docs?: boolean
    paid?: boolean
    description?: string
  }
) {
  const response = await axiosInstance.patch<LeavePolicy>(
    `/leave/policies/${policyId}`,
    values
  )
  return response.data
}

export async function fetchLeaveCalendar(start: string, end: string) {
  const response = await axiosInstance.get<CalendarLeave[]>(
    "/leave/calendar",
    { params: { start, end } }
  )
  return response.data
}

// The .ics endpoint needs the bearer token, so it is downloaded as a blob
export async function downloadLeaveCalendar(start: string, end: string) {
  const response = await axiosInstance.get<Blob>("/mnc/calendar.ics", {
    params: { start, end },
    responseType: "blob",
  })
  return response.data
}
