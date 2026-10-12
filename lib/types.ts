export type LeaveType = "annual" | "sick" | "emergency" | "unpaid"

export type LeaveStatus = "pending" | "approved" | "rejected" | "recalled"

export type Location = {
  id: string
  name: string
}

export type Staff = {
  id: string
  name: string
  role: string
  locationId: string
  email?: string
  phone?: string
  startDate: string
}

// Dates are ISO strings (yyyy-MM-dd); start and end are both inclusive
export type LeaveRequest = {
  id: string
  staffId: string
  type: LeaveType
  startDate: string
  endDate: string
  days: number
  status: LeaveStatus
  reason?: string
  rejectionReason?: string
  createdAt: string
}
