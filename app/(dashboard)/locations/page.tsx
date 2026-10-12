import { LocationsView } from "@/components/locations/locations-view"
import { locations, staff } from "@/lib/mock-data"

export default function LocationsPage() {
  const withCounts = locations.map((location) => ({
    ...location,
    staffCount: staff.filter((s) => s.locationId === location.id).length,
  }))

  return <LocationsView initialLocations={withCounts} />
}
