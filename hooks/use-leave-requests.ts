import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { fetchLeaveRequests, leaveKeys } from "@/lib/api/leaves"
import type { LeaveFilters } from "@/lib/types"

// Leave requests, cached per filter set. Pass `enabled: false` to wait until
// a filter (like a picked staff member) is ready before fetching.
export function useLeaveRequests(
  filters: LeaveFilters = {},
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: leaveKeys.list(filters),
    queryFn: () => fetchLeaveRequests(filters),
    placeholderData: keepPreviousData,
    enabled,
  })
}
