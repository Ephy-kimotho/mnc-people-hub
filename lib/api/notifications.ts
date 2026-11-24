import { axiosInstance } from "@/lib/axios"
import type { NotificationRecord, NotificationStats } from "@/lib/types"

export const notificationKeys = {
  all: ["notifications"] as const,
  history: (limit: number, offset: number) =>
    ["notifications", "history", limit, offset] as const,
  stats: ["notifications", "stats"] as const,
}

export async function fetchNotificationHistory(limit = 100, offset = 0) {
  const response = await axiosInstance.get<NotificationRecord[]>(
    "/notifications/history",
    { params: { limit, offset } }
  )
  return response.data
}

export async function fetchNotificationStats() {
  const response = await axiosInstance.get<NotificationStats>(
    "/notifications/stats"
  )
  return response.data
}

export async function retryNotification(id: string) {
  const response = await axiosInstance.post<NotificationRecord>(
    `/notifications/retry/${id}`
  )
  return response.data
}
