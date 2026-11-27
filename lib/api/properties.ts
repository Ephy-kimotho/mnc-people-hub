import { axiosInstance } from "@/lib/axios"
import type {
  BankAccountInput,
  LeaseInput,
  MaintenanceInput,
  PropertyInput,
  ReminderInput,
  RentPaymentInput,
  TenantInput,
  UnitInput,
} from "@/lib/schemas/property"
import type {
  BankAccount,
  DepositTopup,
  FxRate,
  InsurancePolicy,
  Lease,
  Maintenance,
  NeedsAttentionAlert,
  Property,
  PropertyContact,
  PropertyDashboard,
  PropertyDocument,
  PropertyOwner,
  PropertyUnit,
  Reminder,
  RentCollection,
  Tenant,
  TenantDocument,
  TenantVehicle,
} from "@/lib/types"

export const propertyKeys = {
  all: ["property"] as const,
  dashboard: () => ["property", "dashboard"] as const,
  properties: () => ["property", "properties"] as const,
  property: (id: string) => ["property", "properties", id] as const,
  units: (id: string) => ["property", "properties", id, "units"] as const,
  allUnits: () => ["property", "units"] as const,
  documents: (id: string) =>
    ["property", "properties", id, "documents"] as const,
  insurance: (id: string) =>
    ["property", "properties", id, "insurance"] as const,
  owners: (id: string) => ["property", "properties", id, "owners"] as const,
  contacts: (id: string) =>
    ["property", "properties", id, "contacts"] as const,
  tenants: (propertyId?: string) =>
    ["property", "tenants", propertyId ?? "all"] as const,
  tenant: (id: string) => ["property", "tenants", "detail", id] as const,
  tenantDocuments: (id: string) =>
    ["property", "tenants", "documents", id] as const,
  tenantVehicles: (id: string) =>
    ["property", "tenants", "vehicles", id] as const,
  leases: (filters: { property_id?: string; status?: string }) =>
    ["property", "leases", filters] as const,
  banks: () => ["property", "bank-accounts"] as const,
  rent: (period: string) => ["property", "rent", period] as const,
  depositTopups: () => ["property", "deposit-topups"] as const,
  needsAttention: () => ["property", "needs-attention"] as const,
  reminders: (filters: { property_id?: string; completed?: boolean }) =>
    ["property", "reminders", filters] as const,
  maintenance: (filters: Record<string, string | undefined>) =>
    ["property", "maintenance", filters] as const,
  maintenanceSummary: (propertyId?: string) =>
    ["property", "maintenance", "summary", propertyId ?? "all"] as const,
}

// Drops empty filters/fields so the API sees only what was set
function clean<T extends Record<string, unknown>>(values: T) {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  )
}

function params(filters: Record<string, string | undefined>) {
  return clean(filters)
}

// ── Dashboard ─────────────────────────────────────────────────────

export async function fetchPropertyDashboard() {
  const response = await axiosInstance.get<PropertyDashboard>(
    "/property/dashboard"
  )
  return response.data
}

export async function fetchUsdKesRate() {
  const response = await axiosInstance.get<FxRate>("/property/fx/usd-kes")
  return response.data
}

// ── Properties + units ────────────────────────────────────────────

export async function fetchProperties() {
  const response = await axiosInstance.get<Property[]>("/property/properties")
  return response.data
}

export async function fetchProperty(propertyId: string) {
  const response = await axiosInstance.get<Property>(
    `/property/properties/${propertyId}`
  )
  return response.data
}

export async function createProperty(values: PropertyInput) {
  const response = await axiosInstance.post<Property>(
    "/property/properties",
    clean(values)
  )
  return response.data
}

export async function updateProperty(
  propertyId: string,
  values: Partial<PropertyInput>
) {
  const response = await axiosInstance.patch<Property>(
    `/property/properties/${propertyId}`,
    clean(values)
  )
  return response.data
}

export async function deleteProperty(propertyId: string) {
  await axiosInstance.delete(`/property/properties/${propertyId}`)
}

export async function fetchUnits(propertyId: string) {
  const response = await axiosInstance.get<PropertyUnit[]>(
    `/property/properties/${propertyId}/units`
  )
  return response.data
}

export async function fetchAllUnits() {
  const response = await axiosInstance.get<PropertyUnit[]>("/property/units")
  return response.data
}

export async function createUnit(propertyId: string, values: UnitInput) {
  const response = await axiosInstance.post<PropertyUnit>(
    `/property/properties/${propertyId}/units`,
    clean(values)
  )
  return response.data
}

export async function updateUnit(unitId: string, values: Partial<UnitInput>) {
  const response = await axiosInstance.patch<PropertyUnit>(
    `/property/units/${unitId}`,
    clean(values)
  )
  return response.data
}

export async function deleteUnit(unitId: string) {
  await axiosInstance.delete(`/property/units/${unitId}`)
}

// ── Property documents & photos ───────────────────────────────────

export async function fetchPropertyDocuments(propertyId: string) {
  const response = await axiosInstance.get<PropertyDocument[]>(
    `/property/properties/${propertyId}/documents`
  )
  return response.data
}

export async function uploadPropertyDocument(
  propertyId: string,
  values: { name: string; category: string; file: File }
) {
  const body = new FormData()
  body.append("file", values.file)
  body.append("name", values.name)
  body.append("category", values.category)
  const response = await axiosInstance.post<PropertyDocument>(
    `/property/properties/${propertyId}/documents`,
    body
  )
  return response.data
}

export async function deletePropertyDocument(documentId: string) {
  await axiosInstance.delete(`/property/property-documents/${documentId}`)
}

export async function fetchPropertyDocumentUrl(documentId: string) {
  const response = await axiosInstance.get<{
    url: string
    expires_in: number | null
    filename: string
  }>(`/property/property-documents/${documentId}/url`)
  return response.data
}

export async function uploadPropertyPhoto(propertyId: string, file: File) {
  const body = new FormData()
  body.append("file", file)
  const response = await axiosInstance.post<{ photo_url: string }>(
    `/property/properties/${propertyId}/photo`,
    body
  )
  return response.data
}

export async function deletePropertyPhoto(propertyId: string) {
  await axiosInstance.delete(`/property/properties/${propertyId}/photo`)
}

// ── Insurance ─────────────────────────────────────────────────────

export async function fetchInsurance(propertyId: string) {
  const response = await axiosInstance.get<InsurancePolicy[]>(
    `/property/properties/${propertyId}/insurance`
  )
  return response.data
}

export async function createInsurance(
  propertyId: string,
  values: {
    insurance_type: string
    insurer?: string
    policy_number?: string
    premium_kes?: number
    valid_from?: string
    valid_until?: string
    status: string
    notes?: string
  }
) {
  const response = await axiosInstance.post<InsurancePolicy>(
    `/property/properties/${propertyId}/insurance`,
    clean(values)
  )
  return response.data
}

export async function deleteInsurance(policyId: string) {
  await axiosInstance.delete(`/property/insurance-policies/${policyId}`)
}

// ── Ownership & contacts ──────────────────────────────────────────

export async function fetchOwners(propertyId: string) {
  const response = await axiosInstance.get<PropertyOwner[]>(
    `/property/properties/${propertyId}/owners`
  )
  return response.data
}

export async function createOwner(
  propertyId: string,
  values: { name: string; entity_type: string; share_pct: number }
) {
  const response = await axiosInstance.post<PropertyOwner>(
    `/property/properties/${propertyId}/owners`,
    clean(values)
  )
  return response.data
}

export async function deleteOwner(ownerId: string) {
  await axiosInstance.delete(`/property/owners/${ownerId}`)
}

export async function fetchContacts(propertyId: string) {
  const response = await axiosInstance.get<PropertyContact[]>(
    `/property/properties/${propertyId}/contacts`
  )
  return response.data
}

export async function createContact(
  propertyId: string,
  values: { role: string; name: string; phone?: string; is_primary: boolean }
) {
  const response = await axiosInstance.post<PropertyContact>(
    `/property/properties/${propertyId}/contacts`,
    clean(values)
  )
  return response.data
}

export async function deleteContact(contactId: string) {
  await axiosInstance.delete(`/property/contacts/${contactId}`)
}

// ── Tenants ───────────────────────────────────────────────────────

export async function fetchTenants(propertyId?: string) {
  const response = await axiosInstance.get<Tenant[]>("/property/tenants", {
    params: params({ property_id: propertyId }),
  })
  return response.data
}

export async function fetchTenant(tenantId: string) {
  const response = await axiosInstance.get<Tenant>(
    `/property/tenants/${tenantId}`
  )
  return response.data
}

export async function uploadTenantPhoto(tenantId: string, file: File) {
  const body = new FormData()
  body.append("file", file)
  const response = await axiosInstance.post<{ photo_url: string }>(
    `/property/tenants/${tenantId}/photo`,
    body
  )
  return response.data
}

export async function createTenant(values: TenantInput) {
  const response = await axiosInstance.post<Tenant>(
    "/property/tenants",
    clean(values)
  )
  return response.data
}

export async function updateTenant(
  tenantId: string,
  values: Partial<TenantInput> & { status?: string }
) {
  const response = await axiosInstance.patch<Tenant>(
    `/property/tenants/${tenantId}`,
    clean(values)
  )
  return response.data
}

export async function deleteTenant(tenantId: string) {
  await axiosInstance.delete(`/property/tenants/${tenantId}`)
}

// ── Tenant documents & vehicles ───────────────────────────────────

export async function fetchTenantDocuments(tenantId: string) {
  const response = await axiosInstance.get<TenantDocument[]>(
    `/property/tenants/${tenantId}/documents`
  )
  return response.data
}

export async function uploadTenantDocument(
  tenantId: string,
  values: { name: string; category: string; file: File }
) {
  const body = new FormData()
  body.append("file", values.file)
  body.append("name", values.name)
  body.append("category", values.category)
  const response = await axiosInstance.post<TenantDocument>(
    `/property/tenants/${tenantId}/documents`,
    body
  )
  return response.data
}

export async function fetchTenantDocumentUrl(documentId: string) {
  const response = await axiosInstance.get<{
    url: string
    expires_in: number | null
    filename: string
  }>(`/property/tenant-documents/${documentId}/url`)
  return response.data
}

export async function deleteTenantDocument(documentId: string) {
  await axiosInstance.delete(`/property/tenant-documents/${documentId}`)
}

export async function fetchTenantVehicles(tenantId: string) {
  const response = await axiosInstance.get<TenantVehicle[]>(
    `/property/tenants/${tenantId}/vehicles`
  )
  return response.data
}

export async function createTenantVehicle(
  tenantId: string,
  values: {
    make: string
    model?: string
    registration_number: string
    colour?: string
    notes?: string
  }
) {
  const response = await axiosInstance.post<TenantVehicle>(
    `/property/tenants/${tenantId}/vehicles`,
    clean(values)
  )
  return response.data
}

export async function deleteTenantVehicle(vehicleId: string) {
  await axiosInstance.delete(`/property/tenant-vehicles/${vehicleId}`)
}

// ── Leases ────────────────────────────────────────────────────────

export async function fetchLeases(filters: {
  property_id?: string
  status?: string
}) {
  const response = await axiosInstance.get<Lease[]>("/property/leases", {
    params: params(filters),
  })
  return response.data
}

export async function createLease(values: LeaseInput & { status?: string }) {
  const response = await axiosInstance.post<Lease>(
    "/property/leases",
    clean(values)
  )
  return response.data
}

export async function updateLease(
  leaseId: string,
  values: Partial<LeaseInput> & { status?: string }
) {
  const response = await axiosInstance.patch<Lease>(
    `/property/leases/${leaseId}`,
    clean(values)
  )
  return response.data
}

export async function deleteLease(leaseId: string) {
  await axiosInstance.delete(`/property/leases/${leaseId}`)
}

export async function uploadLeaseDocument(leaseId: string, file: File) {
  const body = new FormData()
  body.append("file", file)
  const response = await axiosInstance.post<{ document_url: string }>(
    `/property/leases/${leaseId}/document`,
    body
  )
  return response.data
}

export async function deleteLeaseDocument(leaseId: string) {
  await axiosInstance.delete(`/property/leases/${leaseId}/document`)
}

// ── Bank accounts ─────────────────────────────────────────────────

export async function fetchBankAccounts() {
  const response = await axiosInstance.get<BankAccount[]>(
    "/property/bank-accounts"
  )
  return response.data
}

export async function createBankAccount(values: BankAccountInput) {
  const response = await axiosInstance.post<BankAccount>(
    "/property/bank-accounts",
    clean(values)
  )
  return response.data
}

export async function updateBankAccount(
  accountId: string,
  values: Partial<BankAccountInput> & { is_active?: boolean }
) {
  const response = await axiosInstance.patch<BankAccount>(
    `/property/bank-accounts/${accountId}`,
    clean(values)
  )
  return response.data
}

export async function deleteBankAccount(accountId: string) {
  await axiosInstance.delete(`/property/bank-accounts/${accountId}`)
}

// ── Rent collection ───────────────────────────────────────────────

export async function fetchRentCollection(periodKey: string) {
  const response = await axiosInstance.get<RentCollection[]>(
    `/property/rent-collection/${periodKey}`
  )
  return response.data
}

export async function recordRentPayment(
  leaseId: string,
  periodKey: string,
  values: RentPaymentInput
) {
  const response = await axiosInstance.post<RentCollection>(
    `/property/rent-collection/${leaseId}/${periodKey}`,
    clean(values)
  )
  return response.data
}

export async function fetchDepositTopups() {
  const response = await axiosInstance.get<DepositTopup[]>(
    "/property/deposit-topups"
  )
  return response.data
}

// ── Needs attention ───────────────────────────────────────────────

export async function fetchNeedsAttention() {
  const response = await axiosInstance.get<NeedsAttentionAlert[]>(
    "/property/needs-attention"
  )
  return response.data
}

export async function acknowledgeAlert(alertKey: string) {
  const response = await axiosInstance.post<{ message: string }>(
    "/property/needs-attention/acknowledge",
    { alert_key: alertKey }
  )
  return response.data
}

// ── Reminders ─────────────────────────────────────────────────────

export async function fetchReminders(filters: {
  property_id?: string
  completed?: boolean
}) {
  const response = await axiosInstance.get<Reminder[]>(
    "/property/reminders",
    {
      params: clean({
        property_id: filters.property_id,
        completed: filters.completed ? "true" : undefined,
      }),
    }
  )
  return response.data
}

export async function createReminder(values: ReminderInput) {
  const response = await axiosInstance.post<Reminder>(
    "/property/reminders",
    clean(values)
  )
  return response.data
}

export async function completeReminder(reminderId: string) {
  const response = await axiosInstance.post<Reminder>(
    `/property/reminders/${reminderId}/complete`
  )
  return response.data
}

export async function deleteReminder(reminderId: string) {
  await axiosInstance.delete(`/property/reminders/${reminderId}`)
}

// ── Maintenance ───────────────────────────────────────────────────

export async function fetchMaintenance(
  filters: Record<string, string | undefined>
) {
  const response = await axiosInstance.get<Maintenance[]>(
    "/property/maintenance",
    { params: params(filters) }
  )
  return response.data
}

export async function fetchMaintenanceSummary(propertyId?: string) {
  const response = await axiosInstance.get<{
    total: number
    open: number
    urgent_open: number
  }>("/property/maintenance/summary", {
    params: params({ property_id: propertyId }),
  })
  return response.data
}

export async function createMaintenance(values: MaintenanceInput) {
  const response = await axiosInstance.post<Maintenance>(
    "/property/maintenance",
    clean(values)
  )
  return response.data
}

export async function updateMaintenance(
  maintenanceId: string,
  values: Partial<MaintenanceInput> & { status?: string }
) {
  const response = await axiosInstance.patch<Maintenance>(
    `/property/maintenance/${maintenanceId}`,
    clean(values)
  )
  return response.data
}

export async function resolveMaintenance(maintenanceId: string) {
  const response = await axiosInstance.post<Maintenance>(
    `/property/maintenance/${maintenanceId}/resolve`
  )
  return response.data
}

export async function deleteMaintenance(maintenanceId: string) {
  await axiosInstance.delete(`/property/maintenance/${maintenanceId}`)
}
