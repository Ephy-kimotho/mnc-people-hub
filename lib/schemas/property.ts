import { z } from "zod"

// Optional numbers come from text inputs, so "" must mean "not set"
const optionalNumber = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined
      ? undefined
      : Number(value),
  z.number().optional()
)

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))

export const propertySchema = z.object({
  alias: z.string().trim().min(2, "Enter a property name."),
  title_number: optionalText,
  title_deed_name: optionalText,
  property_type: z.string().min(1, "Choose a property type."),
  county: optionalText,
  location: optionalText,
  size: optionalNumber,
  size_unit: z.string().optional(),
  tenure: z.string().optional(),
  status: z.string().min(1),
  latitude: optionalNumber,
  longitude: optionalNumber,
  google_maps_url: optionalText,
  lease_expiry: optionalText,
  deposit_target_months: z.coerce.number().int().min(1).max(12),
  notes: optionalText,
})
export type PropertyInput = z.infer<typeof propertySchema>

export const unitSchema = z.object({
  label: z.string().trim().min(1, "Enter a unit name."),
  bedrooms: optionalNumber,
  status: z.enum(["Occupied", "Vacant", "UnderMaintenance"]),
  default_rent_kes: optionalNumber,
  default_rent_usd: optionalNumber,
  notes: optionalText,
})
export type UnitInput = z.infer<typeof unitSchema>

export const tenantSchema = z
  .object({
    type: z.enum(["individual", "company"]),
    full_name: optionalText,
    company_name: optionalText,
    phone: optionalText,
    email: z
      .union([z.email("Enter a valid email."), z.literal("")])
      .optional(),
    notes: optionalText,
    consent: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.type === "individual" && !values.full_name) {
      ctx.addIssue({
        code: "custom",
        path: ["full_name"],
        message: "Enter the tenant's full name.",
      })
    }
    if (values.type === "company" && !values.company_name) {
      ctx.addIssue({
        code: "custom",
        path: ["company_name"],
        message: "Enter the company name.",
      })
    }
  })
export type TenantInput = z.infer<typeof tenantSchema>

export const leaseSchema = z
  .object({
    property_id: z.string().min(1, "Choose a property."),
    unit_id: z.string().min(1, "Choose a unit."),
    tenant_id: z.string().min(1, "Choose a tenant."),
    start_date: optionalText,
    end_date: optionalText,
    monthly_rent_kes: optionalNumber,
    monthly_rent_usd: optionalNumber,
    deposit_kes: z.coerce.number().min(0),
    deposit_usd: z.coerce.number().min(0),
    deposit_target_months: z.coerce.number().int().min(1).max(12),
    service_charge_kes: optionalNumber,
    service_charge_account_id: optionalText,
    rent_routing_account_id: optionalText,
    notes: optionalText,
  })
  .refine(
    (values) =>
      !values.start_date ||
      !values.end_date ||
      values.end_date > values.start_date,
    { path: ["end_date"], message: "End date must be after the start date." }
  )
export type LeaseInput = z.infer<typeof leaseSchema>

export const bankAccountSchema = z.object({
  bank_name: z.string().trim().min(1, "Enter the bank name."),
  account_name: z.string().trim().min(1, "Enter the account name."),
  branch: optionalText,
  account_number: optionalText,
  currency: z.string().min(1),
  relationship_manager: optionalText,
  contact: optionalText,
})
export type BankAccountInput = z.infer<typeof bankAccountSchema>

export const reminderSchema = z.object({
  property_id: optionalText,
  tenant_id: optionalText,
  lease_id: optionalText,
  kind: z.string().min(1),
  title: z.string().trim().min(2, "Enter a reminder title."),
  detail: optionalText,
  due_on: optionalText,
  severity: z.enum(["low", "medium", "high", "critical"]),
})
export type ReminderInput = z.infer<typeof reminderSchema>

export const maintenanceSchema = z.object({
  property_id: z.string().min(1, "Choose a property."),
  unit_id: optionalText,
  tenant_id: optionalText,
  kind: z.enum(["maintenance", "repair", "complaint"]),
  title: z.string().trim().min(2, "Enter a title."),
  description: optionalText,
  category: optionalText,
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assigned_to: optionalText,
  contractor: optionalText,
  cost_kes: optionalNumber,
  confidential: z.boolean(),
})
export type MaintenanceInput = z.infer<typeof maintenanceSchema>

export const rentPaymentSchema = z.object({
  paid_kes: z.coerce.number().min(0.01, "Enter the amount paid."),
  payment_method: optionalText,
  payment_ref: optionalText,
  notes: optionalText,
})
export type RentPaymentInput = z.infer<typeof rentPaymentSchema>
