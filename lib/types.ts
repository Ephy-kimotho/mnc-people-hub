export type LeaveType = "annual" | "sick" | "emergency" | "unpaid"

export type LeaveStatus = "pending" | "approved" | "rejected" | "recalled"

export type Location = {
  id: string
  name: string
}

export type RoleName = "admin" | "manager" | "staff"

export type Role = {
  name: RoleName
  label: string
  description: string
  created_at: string
}

export interface AuthUser {
  user_id: string
  username: string
  email: string
  full_name: string
  role: RoleName
  active: boolean
  must_change_password: boolean
  last_login_at: string | null
  failed_login_attempts: number
  locked_until: string | null
  is_locked: boolean
  created_at: string
  updated_at: string
}

// An account as listed on the admin users page
export interface User extends AuthUser {
  staff_id: string | null
}

export type UserStats = {
  total_users: number
  active_users: number
  inactive_users: number
  by_role: Record<RoleName, number>
}

export type UserFilters = {
  role?: RoleName
  active?: boolean
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
