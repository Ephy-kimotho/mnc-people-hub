import { axiosInstance } from "@/lib/axios"
import type { StaffFilters, StaffMember } from "@/lib/types"

// Every staff query shares this prefix, so one invalidation refreshes them all
export const staffKeys = {
  all: ["staff"] as const,
  list: (filters: StaffFilters) => ["staff", "list", filters] as const,
}

// Only active staff are listed; axios drops an unset location from the URL
export async function fetchStaff(filters: StaffFilters) {
  const response = await axiosInstance.get<StaffMember[]>("/staff/staff", {
    params: { active_only: true, ...filters },
  })
  return response.data
}

export async function deleteStaff(staffId: string) {
  await axiosInstance.delete(`/staff/staff/${staffId}`)
}
