export type LeaveType = "annual" | "sick" | "emergency" | "unpaid"

export type LeaveStatus = "pending" | "approved" | "rejected" | "recalled"

export type Location = {
  id: string
  name: string
}

// A work location as returned by GET /staff/locations
export type StaffLocation = {
  location_id: string
  name: string
  address: string
  active: boolean
  created_at: string
  staff_count: number
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

// A staff record as returned by GET /staff/staff and /staff/staff/{id}
export type StaffMember = {
  staff_id: string
  full_name: string
  role: string
  phone: string | null
  email: string | null
  date_of_birth: string | null
  start_date: string | null
  // The location's name, not its id
  work_location: string | null
  work_location_id?: string | null
  staff_number: string | null
  employment_status: string
  national_id: string | null
  passport: string | null
  drivers_licence: string | null
  nssf_number: string | null
  sha_number: string | null
  kra_pin: string | null
  sacco: string | null
  life_cover_provider: string | null
  policy_number: string | null
  life_benefit: number | null
  critical_illness_benefit: number | null
  disability_benefit: number | null
  funeral_benefit: number | null
  life_premium: number | null
  beneficiary: string | null
  beneficiary_id: string | null
  photo_url: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  auth_role: RoleName | null
}

// An emergency contact as returned by GET /staff/staff/{id}/emergency-contacts
export type EmergencyContact = {
  contact_id: string
  full_name: string
  relationship: string
  phone: string
  national_id: string | null
  is_primary: boolean
}

export type StaffFilters = {
  // A location_id from GET /staff/locations
  location?: string
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
