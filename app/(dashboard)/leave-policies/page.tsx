import type { Metadata } from "next"

import { LeavePoliciesView } from "@/components/leave/leave-policies-view"

export const metadata: Metadata = { title: "Leave policies" }

export default function LeavePoliciesPage() {
  return <LeavePoliciesView />
}
