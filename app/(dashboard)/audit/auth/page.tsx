import type { Metadata } from "next"

import { AuthAuditView } from "@/components/audit/auth-audit-view"

export const metadata: Metadata = { title: "Auth audit log" }

export default function AuthAuditPage() {
  return <AuthAuditView />
}
