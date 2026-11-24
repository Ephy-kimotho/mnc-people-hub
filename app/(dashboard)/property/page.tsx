import type { Metadata } from "next"

import { PropertyDashboard } from "@/components/property/property-dashboard"

export const metadata: Metadata = {
  title: "Property overview",
}

export default function PropertyPage() {
  return <PropertyDashboard />
}
