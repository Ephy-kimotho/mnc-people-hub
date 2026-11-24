import { axiosInstance } from "@/lib/axios"
import type { AuthAuditPage } from "@/lib/types"

export const authAuditKey = ["auth-audit"] as const

export async function fetchAuthAudit(limit = 100, offset = 0) {
  const response = await axiosInstance.get<AuthAuditPage>(
    "/auth/audit-log",
    { params: { limit, offset } }
  )
  return response.data
}

export async function exportAuthAudit() {
  const response = await axiosInstance.get<Blob>("/auth/audit-log/export", {
    responseType: "blob",
  })
  return response.data
}
