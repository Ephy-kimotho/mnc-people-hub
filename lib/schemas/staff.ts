import { z } from "zod"

// Kenyan mobile numbers: 07xx / 01xx or +254 7xx, spaces allowed
const KENYAN_PHONE = /^(?:\+254|0)\s?[17]\d{2}\s?\d{3}\s?\d{3}$/

export const staffSchema = z.object({
  name: z.string().trim().min(1, "Full name is required").max(120),
  role: z.string().min(1, "Select a role"),
  locationId: z.string().min(1, "Select a location"),
  email: z
    .string()
    .trim()
    .pipe(z.union([z.literal(""), z.email("Enter a valid email address")])),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || KENYAN_PHONE.test(v), {
      error: "Enter a valid phone number, e.g. 0712 345 678",
    }),
  startDate: z.iso.date("Pick a start date"),
})

export type StaffValues = z.infer<typeof staffSchema>
