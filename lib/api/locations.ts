import { axiosInstance } from "@/lib/axios"
import type { LocationValues } from "@/lib/schemas/location"
import type { StaffLocation } from "@/lib/types"

export const locationsKey = ["locations"] as const

export async function fetchLocations() {
  const response = await axiosInstance.get<StaffLocation[]>("/staff/locations")
  return response.data
}

export async function createLocation(values: LocationValues) {
  const response = await axiosInstance.post<StaffLocation>(
    "/staff/locations",
    values
  )
  return response.data
}

export async function updateLocation(
  locationId: string,
  values: LocationValues
) {
  const response = await axiosInstance.patch<StaffLocation>(
    `/staff/locations/${locationId}`,
    values
  )
  return response.data
}

export async function deleteLocation(locationId: string) {
  await axiosInstance.delete(`/staff/locations/${locationId}`)
}
