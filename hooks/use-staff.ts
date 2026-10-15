import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { fetchStaff, staffKeys } from "@/lib/api/staff"
import type { StaffFilters } from "@/lib/types"

// Active staff, cached per filter set. The previous list stays on screen
// while a new filter loads so tables and pickers don't flash empty.
export function useStaff(filters: StaffFilters = {}) {
  return useQuery({
    queryKey: staffKeys.list(filters),
    queryFn: () => fetchStaff(filters),
    placeholderData: keepPreviousData,
  })
}
