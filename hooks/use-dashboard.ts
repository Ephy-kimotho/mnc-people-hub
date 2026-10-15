import { useQuery } from "@tanstack/react-query"

import { dashboardKey, fetchDashboard } from "@/lib/api/dashboard"

// Overview totals. Always stale, so every visit to the overview refetches
// and picks up leave or staff changes made on other pages.
export function useDashboard() {
  return useQuery({
    queryKey: dashboardKey,
    queryFn: fetchDashboard,
    staleTime: 0,
  })
}
