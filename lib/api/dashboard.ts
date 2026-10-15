import { axiosInstance } from "@/lib/axios"
import type { DashboardSummary } from "@/lib/types"

export const dashboardKey = ["dashboard"] as const

export async function fetchDashboard() {
  const response = await axiosInstance.get<DashboardSummary>("/mnc/dashboard")
  return response.data
}
