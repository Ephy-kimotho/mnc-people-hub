"use client"

import Link from "next/link"
import { Building2Icon, EllipsisVerticalIcon, PlusIcon } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { DeletePropertyDialog } from "@/components/property/delete-property-dialog"
import { PropertyDialog } from "@/components/property/property-dialog"
import { useProperties } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import { formatCurrency } from "@/lib/format"
import { canManageProperty } from "@/lib/permissions"
import type { Property } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

export function PropertiesView() {
  const { user } = useAuth()
  const canManage = canManageProperty(user)
  const query = useProperties()
  const [dialog, setDialog] = useState<"form" | "delete" | null>(null)
  const [selected, setSelected] = useState<Property>()

  function open(kind: "form" | "delete", property?: Property) {
    setSelected(property)
    setDialog(kind)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Portfolio"
        title="Properties"
        description="Every property in the portfolio, with its units and rent position."
        action={
          canManage && (
            <Button
              className="h-10 self-start rounded-full px-5"
              onClick={() => open("form")}
            >
              <PlusIcon />
              Add property
            </Button>
          )
        }
      />

      {query.isPending ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-52 rounded-2xl" />
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
      ) : (query.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          <Building2Icon className="size-5 text-brand-ink" />
          No properties yet. Add the first one.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(query.data ?? []).map((property) => (
            <PropertyCard
              key={property.property_id}
              property={property}
              canManage={canManage}
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
  onEdit,
  onDelete,
}: {
  property: Property
  canManage: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card className="gap-4 rounded-2xl p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/property/properties/${property.property_id}`}
            className="font-heading text-lg font-semibold hover:underline"
          >
            {property.alias}
          </Link>
          <p className="truncate text-sm text-muted-foreground">
            {[property.location, property.county].filter(Boolean).join(" · ") ||
              "No location set"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Badge variant={property.status === "Active" ? "secondary" : "outline"}>
            {property.status}
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
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Units</p>
          <p className="font-semibold">
            {property.occupied_count ?? 0} / {property.unit_count ?? 0} occupied
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Monthly rent</p>
          <p className="font-semibold">
            {formatCurrency(property.monthly_rent_kes ?? 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Deposits</p>
          <p className="font-semibold">
            {formatCurrency(property.deposits_kes ?? 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Type</p>
          <p className="font-semibold">{property.property_type}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Record completeness</span>
          <span>{property.completeness}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand"
            style={{ width: `${property.completeness}%` }}
          />
        </div>
      </div>
    </Card>
  )
}
