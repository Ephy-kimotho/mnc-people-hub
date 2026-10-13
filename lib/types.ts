export type LeaveType = "annual" | "sick" | "emergency" | "unpaid"

export type LeaveStatus = "pending" | "approved" | "rejected" | "recalled"

export type Location = {
  id: string
  name: string
}

export type RoleName = "admin" | "manager" | "staff"

export interface AuthUser {
  user_id: string
  username: string
  email: string
  full_name: string
  role: RoleName
  active: boolean
  must_change_password: boolean
  last_login_at: string
  failed_login_attempts: number
  locked_until: string | null
  is_locked: boolean
  created_at: string
  updated_at: string
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
