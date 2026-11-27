"use client"

import {
  Building2Icon,
  EllipsisVerticalIcon,
  ExternalLinkIcon,
  PlusIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { DeleteTenantDialog } from "@/components/property/delete-tenant-dialog"
import { TenantDialog } from "@/components/property/tenant-dialog"
import { useTenants } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import { canManageProperty } from "@/lib/permissions"
import type { Tenant } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

function displayName(tenant: Tenant) {
  return tenant.full_name || tenant.company_name || "Tenant"
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

const statusTone: Record<string, string> = {
  Active:
    "border-emerald-700/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  Inactive: "border-border bg-muted text-muted-foreground",
  Blacklisted: "border-destructive/30 bg-destructive/10 text-destructive",
}

const UNASSIGNED = "No active lease"

export function TenantsView() {
  const { user } = useAuth()
  const canManage = canManageProperty(user)
  const query = useTenants()
  const [search, setSearch] = useState("")
  const [propertyFilter, setPropertyFilter] = useState("all")
  const [dialog, setDialog] = useState<"form" | "delete" | null>(null)
  const [selected, setSelected] = useState<Tenant>()

  function open(kind: "form" | "delete", tenant?: Tenant) {
    setSelected(tenant)
    setDialog(kind)
  }

  const term = search.trim().toLowerCase()
  const propertyOptions = Array.from(
    new Set(
      (query.data ?? [])
        .map((tenant) => tenant.property_alias)
        .filter(Boolean) as string[]
    )
  ).sort()

  const filtered = (query.data ?? []).filter((tenant) => {
    const group = tenant.property_alias ?? UNASSIGNED
    if (propertyFilter !== "all" && group !== propertyFilter) return false
    if (!term) return true
    return [
      tenant.full_name,
      tenant.company_name,
      tenant.mobile,
      tenant.phone,
      tenant.email,
      tenant.unit_label,
      tenant.property_alias,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(term)
  })

  const groups = new Map<string, Tenant[]>()
  for (const tenant of filtered) {
    const key = tenant.property_alias ?? UNASSIGNED
    const list = groups.get(key) ?? []
    list.push(tenant)
    groups.set(key, list)
  }
  const orderedGroups = Array.from(groups.entries()).sort(([a], [b]) => {
    if (a === UNASSIGNED) return 1
    if (b === UNASSIGNED) return -1
    return a.localeCompare(b)
  })

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Tenant register"
        title="Tenants"
        description="Tenant profiles grouped by property and unit."
        action={
          canManage && (
            <Button
              className="h-10 self-start rounded-full bg-emerald-800 px-5 text-white hover:bg-emerald-900"
              onClick={() => open("form")}
            >
              <PlusIcon />
              Add Tenant
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, phone, email or unit…"
            className="h-11 rounded-full pl-9"
          />
        </div>
        <select
          value={propertyFilter}
          onChange={(event) => setPropertyFilter(event.target.value)}
          className="h-11 rounded-full border bg-background px-3.5 text-sm"
          aria-label="Filter by property"
        >
          <option value="all">All Properties</option>
          {propertyOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {query.isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(query.error, "Couldn't load tenants.")}
          </p>
          <Button
            variant="outline"
            className="h-10 rounded-full px-5"
            onClick={() => query.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : (query.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          <UsersIcon className="size-5 text-emerald-800" />
          No tenants yet. Add the first one.
        </div>
      ) : orderedGroups.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          <UsersIcon className="size-5 text-emerald-800" />
          No tenants match these filters.
        </div>
      ) : (
        <div className="space-y-8">
          {orderedGroups.map(([alias, tenants]) => {
            const propertyId = tenants.find(
              (tenant) => tenant.property_id
            )?.property_id
            return (
              <section key={alias} className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2Icon className="size-5 text-emerald-800" />
                      <h2 className="font-heading text-lg font-semibold">
                        {alias}
                      </h2>
                      <Badge variant="secondary" className="rounded-full">
                        {tenants.length}{" "}
                        {tenants.length === 1 ? "tenant" : "tenants"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Occupied units and active tenant profiles
                    </p>
                  </div>
                  {propertyId ? (
                    <Link
                      href={`/property/properties/${propertyId}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                      View Property
                      <ExternalLinkIcon className="size-3.5" />
                    </Link>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {tenants.map((tenant) => {
                    const name = displayName(tenant)
                    return (
                      <Card
                        key={tenant.tenant_id}
                        className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 shadow-xs"
                      >
                        <Link
                          href={`/property/tenants/${tenant.tenant_id}`}
                          className="flex min-w-0 flex-1 items-center gap-3"
                        >
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted font-heading text-xs font-bold text-muted-foreground">
                            {initials(name) || "T"}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium">
                                {name}
                              </span>
                              <Badge
                                variant="outline"
                                className={`shrink-0 rounded-full ${statusTone[tenant.status] ?? ""}`}
                              >
                                {tenant.status}
                              </Badge>
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                              {tenant.unit_label ?? "No unit"}
                            </p>
                          </div>
                        </Link>
                        {canManage ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="shrink-0 rounded-full"
                              >
                                <EllipsisVerticalIcon />
                                <span className="sr-only">
                                  Actions for {name}
                                </span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/property/tenants/${tenant.tenant_id}`}
                                >
                                  Open
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => open("form", tenant)}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => open("delete", tenant)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </Card>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <TenantDialog
        open={dialog === "form"}
        onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        tenant={selected}
      />
      <DeleteTenantDialog
        open={dialog === "delete"}
        onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        tenant={selected}
      />
    </div>
  )
}
