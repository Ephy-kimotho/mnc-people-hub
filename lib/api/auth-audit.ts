import { axiosInstance } from "@/lib/axios"
import type { AuthAuditPage } from "@/lib/types"

export const authAuditKey = ["auth-audit"] as const

export interface AuthAuditFilters {
  username?: string
  action?: string
}

function params(filters: AuthAuditFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value)
  )
}

export async function fetchAuthAudit(
  limit = 50,
  offset = 0,
  filters: AuthAuditFilters = {}
) {
  const response = await axiosInstance.get<AuthAuditPage>(
    "/auth/audit-log",
    { params: { limit, offset, ...params(filters) } }
  )
  return response.data
}

export async function exportAuthAudit(filters: AuthAuditFilters = {}) {
  const response = await axiosInstance.get<Blob>("/auth/audit-log/export", {
    params: params(filters),
    responseType: "blob",
  })
  return response.data
}
