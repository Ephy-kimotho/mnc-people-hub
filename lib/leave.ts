import {
  addDays,
  differenceInBusinessDays,
  getYear,
  isWithinInterval,
  parseISO,
  startOfDay,
} from "date-fns"

import type { LeaveRequest, LeaveStatus, LeaveType } from "@/lib/types"

// Statutory annual leave under the Kenya Employment Act
export const ANNUAL_LEAVE_DAYS = 21

export const leaveTypeLabels: Record<LeaveType, string> = {
  annual: "Annual",
  sick: "Sick",
  emergency: "Emergency",
  unpaid: "Unpaid",
}

export const leaveStatusLabels: Record<LeaveStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  recalled: "Recalled",
}

// Approved leave that covers the given day
export function isOnLeave(request: LeaveRequest, day = new Date()) {
  return (
    request.status === "approved" &&
    isWithinInterval(startOfDay(day), {
      start: parseISO(request.startDate),
      end: parseISO(request.endDate),
    })
  )
}

export function latestRequests(requests: LeaveRequest[], count: number) {
  return [...requests]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, count)
}

// Approved annual leave days a staff member has used in the given year
export function annualLeaveTaken(
  requests: LeaveRequest[],
  staffId: string,
  year = getYear(new Date())
) {
  return requests
    .filter(
      (r) =>
        r.staffId === staffId &&
        r.type === "annual" &&
        r.status === "approved" &&
        getYear(parseISO(r.startDate)) === year
    )
    .reduce((total, r) => total + r.days, 0)
}

// Mon–Fri days in an inclusive date range; public holidays aren't excluded yet
export function workingDays(startDate: string, endDate: string) {
  return differenceInBusinessDays(
    addDays(parseISO(endDate), 1),
    parseISO(startDate)
  )
}
