import { isAxiosError } from "axios"

import { axiosInstance } from "@/lib/axios"
import type { EmergencyContactValues } from "@/lib/schemas/emergency-contact"
import {
  lifeCoverAmounts,
  type StaffProfileValues,
  type StaffValues,
} from "@/lib/schemas/staff"
import type {
  EmergencyContact,
  StaffFilters,
  StaffMember,
  StaffPhoto,
} from "@/lib/types"

// Every staff query shares this prefix, so one invalidation refreshes them all
export const staffKeys = {
  all: ["staff"] as const,
  list: (filters: StaffFilters) => ["staff", "list", filters] as const,
  detail: (staffId: string) => ["staff", "detail", staffId] as const,
  emergencyContacts: (staffId: string) =>
    ["staff", "detail", staffId, "emergency-contacts"] as const,
  photo: (staffId: string) => ["staff", "detail", staffId, "photo"] as const,
}

// Only active staff are listed; axios drops an unset location from the URL
export async function fetchStaff(filters: StaffFilters) {
  const response = await axiosInstance.get<StaffMember[]>("/staff/staff", {
    params: { active_only: true, ...filters },
  })
  return response.data
}

export async function fetchStaffMember(staffId: string) {
  const response = await axiosInstance.get<StaffMember>(
    `/staff/staff/${staffId}`
  )
  return response.data
}

// The API wants the location's name alongside its id. Optional fields left
// blank are dropped so the server doesn't validate empty strings.
export async function createStaff(values: StaffValues, workLocation: string) {
  const response = await axiosInstance.post<StaffMember>("/staff/staff", {
    ...values,
    email: values.email || undefined,
    phone: values.phone || undefined,
    date_of_birth: values.date_of_birth || undefined,
    work_location: workLocation,
  })
  return response.data
}

// Blank fields are sent as null so clearing an input clears the record.
// Fields the form doesn't edit are sent back unchanged.
export async function updateStaffProfile(
  staff: StaffMember,
  values: StaffProfileValues,
  workLocation: string
) {
  const payload: Record<string, unknown> = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value || null])
  )
  for (const key of lifeCoverAmounts) {
    const value = values[key]
    payload[key] = value ? Number(value.replaceAll(",", "")) : null
  }

  const response = await axiosInstance.patch<StaffMember>(
    `/staff/staff/${staff.staff_id}/profile`,
    {
      ...payload,
      work_location: workLocation,
      staff_number: staff.staff_number,
      employment_status: staff.employment_status,
      photo_url: staff.photo_url,
      is_active: staff.is_active,
    }
  )
  return response.data
}

export async function deleteStaff(staffId: string) {
  await axiosInstance.delete(`/staff/staff/${staffId}`)
}

export async function fetchEmergencyContacts(staffId: string) {
  const response = await axiosInstance.get<EmergencyContact[]>(
    `/staff/staff/${staffId}/emergency-contacts`
  )
  return response.data
}

// A blank national ID is dropped rather than sent as ""
export async function createEmergencyContact(
  staffId: string,
  values: EmergencyContactValues
) {
  const response = await axiosInstance.post<EmergencyContact>(
    `/staff/staff/${staffId}/emergency-contacts`,
    { ...values, national_id: values.national_id || undefined }
  )
  return response.data
}

export async function deleteEmergencyContact(contactId: string) {
  await axiosInstance.delete(`/staff/emergency-contacts/${contactId}`)
}

// A 404 means there was no photo to delete, which is fine
export async function deleteStaffPhoto(staffId: string) {
  try {
    await axiosInstance.delete(`/staff/staff/${staffId}/photo`)
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return
    throw error
  }
}

// Sent as multipart form data; axios sets the boundary header itself
export async function uploadStaffPhoto(staffId: string, photo: File) {
  const body = new FormData()
  body.append("file", photo)
  const response = await axiosInstance.post<StaffMember>(
    `/staff/staff/${staffId}/photo`,
    body
  )
  return response.data
}

// A short-lived signed link to the photo in storage, with its lifetime in
// seconds. A 404 means no photo has been uploaded.
export async function fetchStaffPhoto(staffId: string) {
  try {
    const response = await axiosInstance.get<StaffPhoto>(
      `/staff/staff/${staffId}/photo`
    )
    return response.data
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}
