import type { Metadata } from "next"

import { LeasesView } from "@/components/property/leases-view"

export const metadata: Metadata = { title: "Leases" }

export default function LeasesPage() {
  return <LeasesView />
}
