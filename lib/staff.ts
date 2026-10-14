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

// "Abdi Nyongesa" -> "A"; matches the single-letter avatars in the design
export function initials(name: string) {
  return name.trim().charAt(0).toUpperCase()
}
