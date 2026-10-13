import { useQuery } from "@tanstack/react-query"

import { fetchLocations, locationsKey } from "@/lib/api/locations"

// One cached list shared by the locations page and every location picker
export function useLocations() {
  return useQuery({
    queryKey: locationsKey,
    queryFn: fetchLocations,
  })
}
