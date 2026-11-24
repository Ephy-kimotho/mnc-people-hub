import { useQuery } from "@tanstack/react-query"

import {
  authAuditKey,
  fetchAuthAudit,
  type AuthAuditFilters,
} from "@/lib/api/auth-audit"
import {
  fetchLeaveCalendar,
  fetchLeavePolicies,
  leaveKeys,
} from "@/lib/api/leaves"
import {
  fetchNotificationHistory,
  fetchNotificationStats,
  notificationKeys,
} from "@/lib/api/notifications"

export function useLeavePolicies() {
  return useQuery({
    queryKey: leaveKeys.policies,
    queryFn: fetchLeavePolicies,
  })
}

export function useLeaveCalendar(start: string, end: string) {
  return useQuery({
    queryKey: leaveKeys.calendar(start, end),
    queryFn: () => fetchLeaveCalendar(start, end),
    enabled: Boolean(start && end),
  })
}

export function useNotificationHistory(limit = 100, offset = 0) {
  return useQuery({
    queryKey: notificationKeys.history(limit, offset),
    queryFn: () => fetchNotificationHistory(limit, offset),
  })
}

export function useNotificationStats() {
  return useQuery({
    queryKey: notificationKeys.stats,
    queryFn: fetchNotificationStats,
  })
}

export function useAuthAudit(
  limit = 50,
  offset = 0,
  filters: AuthAuditFilters = {}
) {
  return useQuery({
    queryKey: [...authAuditKey, limit, offset, filters],
    queryFn: () => fetchAuthAudit(limit, offset, filters),
    placeholderData: (previous) => previous,
  })
}
