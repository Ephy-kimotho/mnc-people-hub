import { keepPreviousData, useQuery } from "@tanstack/react-query"

import {
  fetchAllUnits,
  fetchBankAccounts,
  fetchDepositTopups,
  fetchLeases,
  fetchMaintenance,
  fetchMaintenanceSummary,
  fetchNeedsAttention,
  fetchProperties,
  fetchProperty,
  fetchPropertyDashboard,
  fetchReminders,
  fetchRentCollection,
  fetchTenant,
  fetchTenants,
  fetchUsdKesRate,
  fetchUnits,
  propertyKeys,
} from "@/lib/api/properties"

export function useFxRate() {
  return useQuery({
    queryKey: ["property", "fx"],
    queryFn: fetchUsdKesRate,
    staleTime: 60 * 60 * 1000,
  })
}

export function usePropertyDashboard() {
  return useQuery({
    queryKey: propertyKeys.dashboard(),
    queryFn: fetchPropertyDashboard,
    staleTime: 0,
  })
}

export function useProperties({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: propertyKeys.properties(),
    queryFn: fetchProperties,
    enabled,
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

export function useAllUnits() {
  return useQuery({
    queryKey: propertyKeys.allUnits(),
    queryFn: fetchAllUnits,
  })
}

export function useTenants(
  propertyId?: string,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: propertyKeys.tenants(propertyId),
    queryFn: () => fetchTenants(propertyId),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useTenant(tenantId: string) {
  return useQuery({
    queryKey: propertyKeys.tenant(tenantId),
    queryFn: () => fetchTenant(tenantId),
    enabled: Boolean(tenantId),
  })
}

export function useLeases(
  filters: { property_id?: string; status?: string },
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: propertyKeys.leases(filters),
    queryFn: () => fetchLeases(filters),
    placeholderData: keepPreviousData,
    enabled,
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

export function useDepositTopups() {
  return useQuery({
    queryKey: propertyKeys.depositTopups(),
    queryFn: fetchDepositTopups,
  })
}

export function useNeedsAttention() {
  return useQuery({
    queryKey: propertyKeys.needsAttention(),
    queryFn: fetchNeedsAttention,
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
