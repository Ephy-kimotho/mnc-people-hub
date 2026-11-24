import { axiosInstance } from "@/lib/axios"
import type {
  Announcement,
  Anniversary,
  AuditEntry,
  Birthday,
} from "@/lib/types"

export const mncKeys = {
  all: ["mnc"] as const,
  announcements: () => ["mnc", "announcements"] as const,
  birthdays: () => ["mnc", "birthdays"] as const,
  anniversaries: () => ["mnc", "anniversaries"] as const,
  settings: () => ["mnc", "settings"] as const,
  audit: () => ["mnc", "audit"] as const,
}

export async function fetchAnnouncements() {
  const response = await axiosInstance.get<Announcement[]>(
    "/mnc/announcements"
  )
  return response.data
}

export async function createAnnouncement(values: {
  title: string
  message: string
}) {
  const response = await axiosInstance.post<Announcement>(
    "/mnc/announcements",
    values
  )
  return response.data
}

export async function deleteAnnouncement(id: string) {
  await axiosInstance.delete(`/mnc/announcements/${id}`)
}

export async function fetchBirthdays(days = 30) {
  const response = await axiosInstance.get<Birthday[]>(
    "/mnc/upcoming/birthdays",
    { params: { days } }
  )
  return response.data
}

export async function fetchAnniversaries(days = 30) {
  const response = await axiosInstance.get<Anniversary[]>(
    "/mnc/upcoming/anniversaries",
    { params: { days } }
  )
  return response.data
}

export async function fetchSettings() {
  const response = await axiosInstance.get<Record<string, string>>(
    "/mnc/settings"
  )
  return response.data
}

export async function updateSetting(key: string, value: string) {
  const response = await axiosInstance.patch<{ key: string; value: string }>(
    `/mnc/settings/${encodeURIComponent(key)}`,
    { value }
  )
  return response.data
}

export async function fetchAudit(limit = 100, offset = 0) {
  const response = await axiosInstance.get<AuditEntry[]>("/mnc/audit", {
    params: { limit, offset },
  })
  return response.data
}
