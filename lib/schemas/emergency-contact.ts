import { z } from "zod"

import { KENYAN_PHONE } from "@/lib/schemas/staff"

// Field names match POST /staff/staff/{id}/emergency-contacts
export const emergencyContactSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required").max(120),
  relationship: z.string().min(1, "Select a relationship"),
  phone: z
    .string()
    .trim()
    .regex(KENYAN_PHONE, "Enter a valid phone number, e.g. 0712 345 678"),
  national_id: z.string().trim().max(20, "ID number is too long"),
  is_primary: z.boolean(),
})

export type EmergencyContactValues = z.infer<typeof emergencyContactSchema>
