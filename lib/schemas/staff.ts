import { isFuture, parseISO } from "date-fns"
import { z } from "zod"

// Kenyan mobile numbers: 07xx / 01xx or +254 7xx, spaces allowed
export const KENYAN_PHONE = /^(?:\+254|0)\s?[17]\d{2}\s?\d{3}\s?\d{3}$/

// Field names match POST /staff/staff; the location's name is added on save
export const staffSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required").max(120),
  role: z.string().min(1, "Select a role"),
  work_location_id: z.string().min(1, "Select a location"),
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
  date_of_birth: z.union([
    z.literal(""),
    z.iso
      .date()
      .refine(
        (v) => !isFuture(parseISO(v)),
        "Date of birth can't be in the future"
      ),
  ]),
  start_date: z.iso.date("Pick a start date"),
})

export type StaffValues = z.infer<typeof staffSchema>

const optionalText = z
  .string()
  .trim()
  .max(120, "Keep this under 120 characters")

// Amounts stay as text so a blank field means "not applicable"; commas are
// allowed and stripped when the profile is saved
const amount = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d[\d,]*(\.\d{1,2})?$/.test(v), {
    error: "Enter an amount in KES, e.g. 100000",
  })

export const lifeCoverAmounts = [
  "life_benefit",
  "critical_illness_benefit",
  "disability_benefit",
  "funeral_benefit",
  "life_premium",
] as const

// Field names match POST /staff/staff/{id}/profile
export const staffProfileSchema = staffSchema.extend({
  notes: z.string().trim().max(1000, "Keep notes under 1000 characters"),
  national_id: optionalText,
  passport: optionalText,
  drivers_licence: optionalText,
  nssf_number: optionalText,
  sha_number: optionalText,
  kra_pin: optionalText,
  sacco: optionalText,
  life_cover_provider: optionalText,
  policy_number: optionalText,
  beneficiary: optionalText,
  beneficiary_id: optionalText,
  life_benefit: amount,
  critical_illness_benefit: amount,
  disability_benefit: amount,
  funeral_benefit: amount,
  life_premium: amount,
})

export type StaffProfileValues = z.infer<typeof staffProfileSchema>

export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"]
export const PHOTO_MAX_MB = 5

export const staffPhotoSchema = z.object({
  photo: z
    .file("Choose a photo to upload")
    .mime(PHOTO_TYPES, "Use a JPG, PNG or WebP image")
    .max(PHOTO_MAX_MB * 1024 * 1024, `Keep it under ${PHOTO_MAX_MB} MB`),
})

export type StaffPhotoValues = z.infer<typeof staffPhotoSchema>
