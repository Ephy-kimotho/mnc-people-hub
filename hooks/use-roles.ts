import { useQuery } from "@tanstack/react-query"

import { fetchRoles, rolesKey } from "@/lib/api/users"

// Roles rarely change, so one fetch is shared by every screen that needs them
export function useRoles() {
  return useQuery({
    queryKey: rolesKey,
    queryFn: fetchRoles,
    staleTime: Infinity,
  })
}
