import {
  addDays,
  differenceInBusinessDays,
  differenceInMinutes,
  getYear,
  isWithinInterval,
  parse,
  parseISO,
  startOfDay,
} from "date-fns"

import { formatDayCount } from "@/lib/format"

import type {
  DurationType,
  HalfDayPeriod,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
} from "@/lib/types"

// Statutory annual leave under the Kenya Employment Act
export const ANNUAL_LEAVE_DAYS = 21

// Hourly leave is converted to days against an 8-hour workday
export const WORKDAY_HOURS = 8

export const durationTypeLabels: Record<DurationType, string> = {
  full_day: "Full Day",
  half_day: "Half Day",
  hours: "Hours",
}

export const halfDayPeriodLabels: Record<HalfDayPeriod, string> = {
  AM: "Morning",
  PM: "Afternoon",
}

// Times filled in when a half day is picked; staff can still adjust them
export const halfDayTimes: Record<
  HalfDayPeriod,
  { startTime: string; endTime: string }
> = {
  AM: { startTime: "08:00", endTime: "12:00" },
  PM: { startTime: "13:00", endTime: "17:00" },
}

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

// "5 Days", "Half Day · Morning", "3.5 Hours"
export function durationLabel(request: LeaveRequest) {
  if (request.durationType === "half_day") {
    const period = request.halfDayPeriod
    return period ? `Half Day · ${halfDayPeriodLabels[period]}` : "Half Day"
  }
  if (request.durationType === "hours") {
    const hours = request.durationHours ?? request.days * WORKDAY_HOURS
    return `${hours} ${hours === 1 ? "Hour" : "Hours"}`
  }
  return formatDayCount(request.days)
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

// "08:00" to "11:30" is 3.5 hours; both "HH:mm" times fall on the same day
export function hoursBetween(startTime: string, endTime: string) {
  const day = new Date()
  return (
    differenceInMinutes(
      parse(endTime, "HH:mm", day),
      parse(startTime, "HH:mm", day)
    ) / 60
  )
}

// Days a request uses up: weekdays for full days, 0.5 for a half day and
// hours ÷ 8 for hourly leave
export function leaveDays(request: {
  durationType: DurationType
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}) {
  if (request.durationType === "half_day") return 0.5
  if (request.durationType === "hours") {
    return hoursBetween(request.startTime, request.endTime) / WORKDAY_HOURS
  }
  return workingDays(request.startDate, request.endDate)
}
