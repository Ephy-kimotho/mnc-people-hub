import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { fetchLeaveRequests, leaveKeys } from "@/lib/api/leaves"
import { canReviewLeave, canSeeLeave } from "@/lib/permissions"
import type { LeaveFilters } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

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

// Leave the signed-in user may see: everything for admins and managers, only
// their own requests for staff (asked of the server and checked again here)
export function useVisibleLeaveRequests() {
  const { user } = useAuth()
  const staffId = canReviewLeave(user) ? undefined : user?.staff_id
  const query = useLeaveRequests(staffId ? { staff_id: staffId } : {})
  return {
    ...query,
    data: query.data?.filter((request) => canSeeLeave(user, request)),
  }
}
