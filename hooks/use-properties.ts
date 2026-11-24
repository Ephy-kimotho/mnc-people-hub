import { keepPreviousData, useQuery } from "@tanstack/react-query"

import {
  fetchBankAccounts,
  fetchLeases,
  fetchMaintenance,
  fetchMaintenanceSummary,
  fetchProperties,
  fetchProperty,
  fetchPropertyDashboard,
  fetchReminders,
  fetchRentCollection,
  fetchTenants,
  fetchUnits,
  propertyKeys,
} from "@/lib/api/properties"

export function usePropertyDashboard() {
  return useQuery({
    queryKey: propertyKeys.dashboard(),
    queryFn: fetchPropertyDashboard,
    staleTime: 0,
  })
}

export function useProperties() {
  return useQuery({
    queryKey: propertyKeys.properties(),
    queryFn: fetchProperties,
  })
}

export function useProperty(propertyId: string) {
  return useQuery({
    queryKey: propertyKeys.property(propertyId),
    queryFn: () => fetchProperty(propertyId),
    enabled: Boolean(propertyId),
  })
}

export function useUnits(propertyId: string) {
  return useQuery({
    queryKey: propertyKeys.units(propertyId),
    queryFn: () => fetchUnits(propertyId),
    enabled: Boolean(propertyId),
  })
}

export function useTenants(propertyId?: string) {
  return useQuery({
    queryKey: propertyKeys.tenants(propertyId),
    queryFn: () => fetchTenants(propertyId),
    placeholderData: keepPreviousData,
  })
}

export function useLeases(filters: { property_id?: string; status?: string }) {
  return useQuery({
    queryKey: propertyKeys.leases(filters),
    queryFn: () => fetchLeases(filters),
    placeholderData: keepPreviousData,
  })
}

export function useBankAccounts() {
  return useQuery({
    queryKey: propertyKeys.banks(),
    queryFn: fetchBankAccounts,
  })
}

export function useRentCollection(periodKey: string) {
  return useQuery({
    queryKey: propertyKeys.rent(periodKey),
    queryFn: () => fetchRentCollection(periodKey),
    enabled: /^\d{4}-\d{2}$/.test(periodKey),
  })
}

export function useReminders(filters: {
  property_id?: string
  completed?: boolean
}) {
  return useQuery({
    queryKey: propertyKeys.reminders(filters),
    queryFn: () => fetchReminders(filters),
  })
}

export function useMaintenance(filters: Record<string, string | undefined>) {
  return useQuery({
    queryKey: propertyKeys.maintenance(filters),
    queryFn: () => fetchMaintenance(filters),
    placeholderData: keepPreviousData,
  })
}

export function useMaintenanceSummary(propertyId?: string) {
  return useQuery({
    queryKey: propertyKeys.maintenanceSummary(propertyId),
    queryFn: () => fetchMaintenanceSummary(propertyId),
    staleTime: 0,
  })
}
