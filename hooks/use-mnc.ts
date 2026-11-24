import { useQuery } from "@tanstack/react-query"

import {
  fetchAnniversaries,
  fetchAnnouncements,
  fetchAudit,
  fetchBirthdays,
  fetchSettings,
  mncKeys,
} from "@/lib/api/mnc"

export function useAnnouncements() {
  return useQuery({
    queryKey: mncKeys.announcements(),
    queryFn: fetchAnnouncements,
  })
}

export function useBirthdays(enabled = true) {
  return useQuery({
    queryKey: mncKeys.birthdays(),
    queryFn: () => fetchBirthdays(30),
    enabled,
  })
}

export function useAnniversaries(enabled = true) {
  return useQuery({
    queryKey: mncKeys.anniversaries(),
    queryFn: () => fetchAnniversaries(30),
    enabled,
  })
}

export function useSettings(enabled = true) {
  return useQuery({
    queryKey: mncKeys.settings(),
    queryFn: fetchSettings,
    enabled,
  })
}

export function useAudit(limit = 100, offset = 0) {
  return useQuery({
    queryKey: [...mncKeys.audit(), limit, offset],
    queryFn: () => fetchAudit(limit, offset),
  })
}
