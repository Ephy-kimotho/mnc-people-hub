import type { Metadata } from "next"

import { OperationsView } from "@/components/property/operations-view"

export const metadata: Metadata = { title: "Operations" }

export default function OperationsPage() {
  return <OperationsView />
}
