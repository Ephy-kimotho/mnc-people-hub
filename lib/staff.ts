import type { DocumentCategory } from "@/lib/types"

export const staffRoles = [
  "Executive Assistant",
  "Office Administrator",
  "Accountant",
  "HR Business Partner",
  "Housekeeper",
  "Cook",
  "Driver",
  "Gardener",
  "Nanny",
  "Security Guard",
  "Laundry Help",
  "General Help",
]

export const contactRelationships = [
  "Spouse",
  "Parent",
  "Sibling",
  "Child",
  "Friend",
  "Other relative",
]

export const documentCategoryLabels: Record<DocumentCategory, string> = {
  NationalID: "National ID",
  Passport: "Passport",
  DriversLicence: "Driver's Licence",
  Contract: "Contract",
  NSSF: "NSSF",
  SHA: "SHA",
  KRA: "KRA",
  CV: "CV",
  RecommendationLetter: "Recommendation Letter",
  Other: "Other",
}

// "Abdi Nyongesa" -> "A"; matches the single-letter avatars in the design
export function initials(name: string) {
  return name.trim().charAt(0).toUpperCase()
}
