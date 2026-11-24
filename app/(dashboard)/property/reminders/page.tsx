import type { Metadata } from "next"

import { RemindersView } from "@/components/property/reminders-view"

export const metadata: Metadata = { title: "Reminders" }

export default function RemindersPage() {
  return <RemindersView />
}
