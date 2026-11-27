"use client"

import {
  Building2Icon,
  EllipsisVerticalIcon,
  MapPinIcon,
  PlusIcon,
  SearchIcon,
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
import { DeletePropertyDialog } from "@/components/property/delete-property-dialog"
import { PropertyDialog } from "@/components/property/property-dialog"
import { useProperties } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import { formatCurrency } from "@/lib/format"
import { canManageProperty } from "@/lib/permissions"
import type { Property } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

const statusFilters = [
  "all",
  "Let",
  "For Sale",
  "Under Consideration",
  "Sold",
  "Inactive",
  "Active",
] as const

function displayStatus(property: Property) {
  if (property.status === "Sold") return "Sold"
  if (property.status === "For Sale") return "For Sale"
  if (property.status === "Under Consideration") return "Under Consideration"
  if (property.status === "Inactive") return "Inactive"
  return (property.occupied_count ?? 0) > 0 ? "Let" : "Active"
}

const statusPill: Record<string, string> = {
  Let: "border-emerald-700/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  Active:
    "border-emerald-700/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  "For Sale":
    "border-sky-600/30 bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
  "Under Consideration":
    "border-amber-600/30 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  Sold: "border-border bg-muted text-muted-foreground",
  Inactive: "border-border bg-muted text-muted-foreground",
}

const statusBar: Record<string, string> = {
  Let: "bg-emerald-800",
  Active: "bg-emerald-600",
  "For Sale": "bg-sky-600",
  "Under Consideration": "bg-amber-500",
  Sold: "bg-muted-foreground/40",
  Inactive: "bg-amber-500",
}

export function PropertiesView() {
  const { user } = useAuth()
  const canManage = canManageProperty(user)
  const isAdmin = user?.role === "admin"
  const query = useProperties()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<(typeof statusFilters)[number]>("all")
  const [dialog, setDialog] = useState<"form" | "delete" | null>(null)
  const [selected, setSelected] = useState<Property>()

  function open(kind: "form" | "delete", property?: Property) {
    setSelected(property)
    setDialog(kind)
  }

  const term = search.trim().toLowerCase()
  const properties = (query.data ?? []).filter((property) => {
    const matchesSearch =
      !term ||
      [property.alias, property.title_number, property.location, property.county]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    const matchesStatus =
      status === "all" || displayStatus(property) === status
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Portfolio"
        title="Property Register"
        description="Manage and track your physical land and building assets."
        action={
          canManage && (
            <Button
              className="h-10 self-start rounded-full bg-emerald-800 px-5 text-white hover:bg-emerald-900"
              onClick={() => open("form")}
            >
              <PlusIcon />
              Add Property
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
            placeholder="Search by alias, title number, or location…"
            className="h-11 rounded-full pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as (typeof statusFilters)[number])
          }
          className="h-11 rounded-full border bg-background px-3.5 text-sm"
          aria-label="Filter by status"
        >
          {statusFilters.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All statuses" : option}
            </option>
          ))}
        </select>
      </div>

      {query.isPending ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(query.error, "Couldn't load properties.")}
          </p>
          <Button
            variant="outline"
            className="h-10 rounded-full px-5"
            onClick={() => query.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          <Building2Icon className="size-5 text-brand-ink" />
          {query.data?.length === 0
            ? "No properties yet. Add the first one."
            : "No properties match these filters."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard
              key={property.property_id}
              property={property}
              canManage={canManage}
              isAdmin={isAdmin}
              onEdit={() => open("form", property)}
              onDelete={() => open("delete", property)}
            />
          ))}
        </div>
      )}

      <PropertyDialog
        open={dialog === "form"}
        onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        property={selected}
      />
      <DeletePropertyDialog
        open={dialog === "delete"}
        onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        property={selected}
      />
    </div>
  )
}

function PropertyCard({
  property,
  canManage,
  isAdmin,
  onEdit,
  onDelete,
}: {
  property: Property
  canManage: boolean
  isAdmin: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const occupied = property.occupied_count ?? 0
  const total = property.unit_count ?? 0
  const pct = total ? Math.round((occupied / total) * 100) : 0
  const status = displayStatus(property)
  const missingCharges = property.tenants_without_service_charge ?? 0

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl p-0 shadow-xs">
      <div className={`h-1 w-full ${statusBar[status] ?? "bg-amber-500"}`} />
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/property/properties/${property.property_id}`}
            className="min-w-0 truncate font-heading text-xl font-bold tracking-tight hover:underline"
          >
            {property.alias}
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <Badge
              variant="outline"
              className={`rounded-full ${statusPill[status] ?? ""}`}
            >
              {status}
            </Badge>
            {canManage ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" className="rounded-full">
                    <EllipsisVerticalIcon />
                    <span className="sr-only">Actions for {property.alias}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem asChild>
                    <Link href={`/property/properties/${property.property_id}`}>
                      Open
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
                  {isAdmin ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={onDelete}
                      >
                        Delete
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPinIcon className="size-3.5 shrink-0" />
          {[property.location, property.county].filter(Boolean).join(", ") ||
            "No location set"}
        </p>

        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          <div>
            <p className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
              Units
            </p>
            <p className="mt-1 text-sm">
              {occupied} / {total || occupied}
              <span className="text-muted-foreground"> ({pct}% occ.)</span>
            </p>
          </div>
          <div>
            <p className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
              Monthly rent
            </p>
            <p className="mt-1 text-sm font-semibold">
              {formatCurrency(property.monthly_rent_kes ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(property.monthly_rent_usd ?? 0, "USD")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          <div>
            <p className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
              Deposits held
            </p>
            <p className="mt-1 text-sm font-semibold">
              {formatCurrency(property.deposits_kes ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(property.deposits_usd ?? 0, "USD")}
            </p>
          </div>
          <div>
            <p className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
              Monthly service charge
            </p>
            <p className="mt-1 text-sm font-semibold">
              {formatCurrency(property.service_charge_kes ?? 0)}
            </p>
            {missingCharges > 0 ? (
              <p className="text-xs text-amber-600">
                {missingCharges} {missingCharges === 1 ? "tenant" : "tenants"}{" "}
                without a configured charge
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  )
}
