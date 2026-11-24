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
  // The staff record linked to this account, if any. Staff users only see
  // their own leave and profile through it.
  staff_id: string | null
}

// An account as listed on the admin users page
export type User = AuthUser

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

// ── Property ──────────────────────────────────────────────────────

export type Property = {
  property_id: string
  alias: string
  property_type: string
  title_number: string | null
  title_deed_name: string | null
  county: string | null
  location: string | null
  size: number | null
  size_unit: string | null
  tenure: string | null
  lease_expiry: string | null
  status: string
  land_rent_status: string | null
  rates_status: string | null
  deposit_target_months: number
  completeness: number
  photo_url: string | null
  notes: string | null
  created_at: string
  updated_at?: string
  // List rows only
  unit_count?: number
  occupied_count?: number
  monthly_rent_kes?: number
  deposits_kes?: number
  service_charge_kes?: number
}

export type PropertyUnit = {
  unit_id: string
  property_id: string
  label: string
  bedrooms: number | null
  status: string
  default_rent_kes: number | null
  default_rent_usd: number | null
  notes: string | null
  photo_urls?: string[] | null
}

export type Tenant = {
  tenant_id: string
  type: "individual" | "company" | string
  full_name: string | null
  company_name: string | null
  registration_number?: string | null
  contact_person_name?: string | null
  contact_person_phone?: string | null
  contact_person_email?: string | null
  date_of_birth?: string | null
  phone: string | null
  mobile?: string | null
  email: string | null
  id_type?: string | null
  id_number?: string | null
  kra_pin?: string | null
  next_of_kin_name?: string | null
  next_of_kin_phone?: string | null
  next_of_kin_relationship?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  emergency_contact_relationship?: string | null
  status: string
  consent: boolean
  completeness: number
  photo_url: string | null
  notes: string | null
  created_at: string
}

export type Lease = {
  lease_id: string
  property_id: string
  unit_id: string
  tenant_id: string
  start_date: string | null
  end_date: string | null
  monthly_rent_kes: number | null
  monthly_rent_usd: number | null
  deposit_kes: number
  deposit_usd: number
  deposit_target_months: number
  required_deposit_kes: number | null
  deposit_variance_kes: number | null
  service_charge_kes: number | null
  service_charge_account_id: string | null
  rent_routing_account_id: string | null
  electricity_provider: string | null
  water_provider: string | null
  status: string
  notes: string | null
  document_url: string | null
  document_path: string | null
  created_at: string
  property_alias?: string
  unit_label?: string
  tenant_full_name?: string | null
  tenant_company_name?: string | null
}

export type BankAccount = {
  account_id: string
  bank_name: string
  account_name: string
  branch: string | null
  account_number: string | null
  currency: string
  relationship_manager: string | null
  contact: string | null
  is_active: boolean
}

export type Reminder = {
  reminder_id: string
  property_id: string | null
  tenant_id: string | null
  lease_id: string | null
  kind: string
  title: string
  detail: string | null
  due_on: string | null
  severity: string
  completed_at: string | null
  created_at: string
}

export type Maintenance = {
  maintenance_id: string
  property_id: string
  unit_id: string | null
  tenant_id: string | null
  kind: string
  title: string
  description: string | null
  category: string | null
  priority: string
  status: string
  raised_by: string | null
  raised_at: string | null
  assigned_to: string | null
  contractor: string | null
  cost_kes: number | null
  resolved_at: string | null
  resolution_notes: string | null
  confidential: boolean
  photo_urls: string[] | null
  created_at: string
  updated_at: string
}

export type RentCollection = {
  collection_id: string | null
  lease_id: string
  period_key: string
  expected_kes: number | null
  paid_kes: number
  outstanding_kes: number | null
  paid_at: string | null
  payment_method: string | null
  payment_ref: string | null
  notes: string | null
  property_alias?: string
  unit_label?: string
  tenant_full_name?: string | null
  tenant_company_name?: string | null
}

export type DepositAlert = {
  lease_id: string
  full_name: string | null
  company_name: string | null
  property_alias: string
  unit_label: string
  deposit_kes: number
  required: number
  shortfall: number
}

export type PropertyDashboard = {
  total_properties: number
  total_units: number
  occupied_units: number
  occupancy_pct: number
  active_leases: number
  monthly_rent_kes: number
  deposits_kes: number
  service_charge_kes: number
  deposit_alerts: DepositAlert[]
}

// A staff member's assignment to a property (MNC People ↔ MNC Property)
export type PropertyAssignment = {
  assignment_id: string
  staff_id: string
  property_id: string
  property_alias: string
  role_at_property: string | null
  assigned_from: string
  is_current: boolean
  notes: string | null
  created_at: string
}

// ── MNC core ──────────────────────────────────────────────────────

export type Announcement = {
  announcement_id: string
  title: string
  message: string
  author_id: string
  author_name: string | null
  created_at: string
}

export type Birthday = {
  staff_id: string
  full_name: string
  role: string
  work_location: string | null
  date_of_birth: string
  birthday_display: string
}

export type Anniversary = {
  staff_id: string
  full_name: string
  role: string
  work_location: string | null
  start_date: string
  years_completed: number
  anniversary_display: string
}

export type AuditEntry = {
  id: number
  created_at: string
  user_id: string | null
  user_name: string | null
  user_role: string | null
  action: string
  entity: string | null
  entity_id: string | null
  description: string | null
}

// ── Leave policies, calendar, notifications, auth audit ───────────

export type LeavePolicy = {
  policy_id: string
  leave_type: string
  entitlement_days: number
  carry_over: boolean
  requires_docs: boolean
  paid: boolean
  description: string | null
}

export type CalendarLeave = {
  request_id: string
  staff_name: string
  staff_role: string
  leave_type: string
  start_date: string
  end_date: string
  days: number
}

export type NotificationRecord = {
  notification_id: string
  staff_id: string | null
  staff_name: string | null
  recipient_email: string | null
  type: string
  subject: string | null
  status: string
  attempts: number
  error_message: string | null
  sent_at: string | null
  created_at: string
}

export type NotificationStats = {
  total: number
  sent: number
  failed: number
  pending: number
  delivery_rate: number
  by_type: { type: string; count: number }[]
}

export type AuthAuditEntry = {
  id: number
  timestamp: string
  user_id: string | null
  username: string | null
  role: string | null
  ip_address: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  details: string | null
  service: string
}

export type AuthAuditPage = {
  total: number
  limit: number
  offset: number
  entries: AuthAuditEntry[]
}
