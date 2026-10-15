export type LeaveType = "annual" | "sick" | "emergency" | "unpaid"

export type LeaveStatus = "pending" | "approved" | "rejected" | "recalled"

// How much of a day a request covers; see "Leave Duration Types" in
// SYSTEM_ACCESS.md
export type DurationType = "full_day" | "half_day" | "hours"

export type HalfDayPeriod = "AM" | "PM"

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

// The backend's document categories. They're sent lowercased.
export type DocumentCategory =
  | "NationalID"
  | "Passport"
  | "DriversLicence"
  | "Contract"
  | "NSSF"
  | "SHA"
  | "KRA"
  | "CV"
  | "RecommendationLetter"
  | "Other"

// A file in GET /staff/staff/{id}/documents. `public_url` can be opened
// without signing in; `uploaded_by` is a user id.
export type StaffDocument = {
  document_id: string
  staff_id: string
  staff_name: string
  category: DocumentCategory
  label: string | null
  filename: string
  mime_type: string
  file_size_bytes: number
  storage_path: string
  public_url: string
  restricted: boolean
  expiry_date: string | null
  notes: string | null
  uploaded_by: string
  uploaded_at: string
  updated_at: string
}

// GET /staff/staff/{id}/photo: a signed storage URL that stops working
// after `expires_in` seconds
export type StaffPhoto = {
  url: string
  expires_in: number
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

// Query params for GET /leave/leaves; unset ones are left out of the URL
export type LeaveFilters = {
  staff_id?: string
  status?: LeaveStatus
  leave_type?: LeaveType
  year?: number
  duration_type?: DurationType
}

// A leave request as GET /leave/leaves returns it. Types and statuses are
// capitalised ("Annual", "Pending"), times are "HH:mm:ss" and timestamps
// look like "2026-10-14 14:06:26.581789+00:00".
export type LeaveRecord = {
  request_id: string
  staff_id: string
  staff_name: string
  staff_role: string
  // The location's name, not its id
  work_location: string | null
  leave_type: string
  start_date: string
  end_date: string
  duration_type: DurationType
  half_day_period: HalfDayPeriod | null
  duration_hours: number | null
  start_time: string | null
  end_time: string | null
  // Working days the request uses up, worked out by the server
  days: number
  reason: string | null
  status: string
  submitted_by: string
  submitted_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  // The approver's or rejecter's note
  review_note: string | null
  recalled_by: string | null
  recalled_at: string | null
  recall_reason: string | null
  balance_before: number | null
  document_url: string | null
  document_path: string | null
  document_name: string | null
  created_at: string
}

// One leave type's balance for a year, from GET /staff/staff/{id}/leave-balance.
// `leave_type` is capitalised ("Annual") like on LeaveRecord.
export type LeaveBalanceRecord = {
  balance_id: string
  staff_id: string
  year: number
  leave_type: string
  entitlement_days: number
  days_used: number
  days_approved: number
  days_pending: number
  days_remaining: number
}

// The app's view of a leave request, mapped from LeaveRecord in
// lib/api/leaves.ts. Dates are ISO strings (yyyy-MM-dd), both inclusive.
// Times are "HH:mm". `days` is what the request uses up, e.g. 0.5.
export type LeaveRequest = {
  id: string
  staffId: string
  staffName: string
  staffRole: string
  type: LeaveType
  startDate: string
  endDate: string
  days: number
  status: LeaveStatus
  durationType: DurationType
  halfDayPeriod?: HalfDayPeriod
  durationHours?: number
  startTime?: string
  endTime?: string
  reason?: string
  rejectionReason?: string
  createdAt: string
}

// A staff member's leave as the dashboard lists it. `leave_type` is
// capitalised ("Annual") and `work_location` is the location's name.
export type DashboardLeave = {
  staff_name: string
  staff_role: string
  work_location: string | null
  leave_type: string
  start_date: string
  end_date: string
}

// GET /mnc/dashboard
export type DashboardSummary = {
  total_staff: number
  active_staff: number
  on_leave_today: DashboardLeave[]
  pending_leave_requests: number
  upcoming_leave: DashboardLeave[]
}
