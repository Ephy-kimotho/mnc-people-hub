"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon, DoorOpenIcon, PlusIcon } from "lucide-react"
import { useState } from "react"

import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DeletePropertyDialog } from "@/components/property/delete-property-dialog"
import { DeleteUnitDialog } from "@/components/property/delete-unit-dialog"
import { PropertyDialog } from "@/components/property/property-dialog"
import { UnitDialog } from "@/components/property/unit-dialog"
import { useProperty, useUnits } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import { formatCurrency, formatDate } from "@/lib/format"
import { canManageProperty } from "@/lib/permissions"
import type { PropertyUnit } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

export function PropertyDetail({ propertyId }: { propertyId: string }) {
  const router = useRouter()
  const { user } = useAuth()
  const canManage = canManageProperty(user)
  const property = useProperty(propertyId)
  const units = useUnits(propertyId)
  const [dialog, setDialog] = useState<"property" | "delete" | "unit" | null>(
    null
  )
  const [unit, setUnit] = useState<PropertyUnit>()
  const [deleteUnit, setDeleteUnit] = useState<PropertyUnit>()

  if (property.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-60 w-full rounded-2xl" />
      </div>
    )
  }

  if (property.isError || !property.data) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
        <p className="text-sm text-muted-foreground">
          {getErrorMessage(property.error, "Couldn't load this property.")}
        </p>
        <Button asChild variant="outline" className="h-10 rounded-full px-5">
          <Link href="/property/properties">Back to properties</Link>
        </Button>
      </div>
    )
  }

  const data = property.data

  return (
    <div className="space-y-8">
      <Link
        href="/property/properties"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Properties
      </Link>

      <PageHeader
        eyebrow={data.property_type}
        title={data.alias}
        description={[data.location, data.county].filter(Boolean).join(" · ")}
        action={
          canManage && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-10 rounded-full px-5"
                onClick={() => setDialog("property")}
              >
                Edit property
              </Button>
              <Button
                variant="destructive"
                className="h-10 rounded-full px-5"
                onClick={() => setDialog("delete")}
              >
                Delete
              </Button>
            </div>
          )
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant={data.status === "Active" ? "secondary" : "outline"}>
          {data.status}
        </Badge>
        <Badge variant="outline">{data.tenure}</Badge>
        <Badge variant="outline">{data.completeness}% complete</Badge>
      </div>

      <Card className="rounded-2xl p-6">
        <h2 className="font-heading text-lg font-semibold">Details</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Title number" value={data.title_number} />
          <Detail label="Title deed name" value={data.title_deed_name} />
          <Detail
            label="Size"
            value={
              data.size
                ? `${data.size} ${data.size_unit ?? ""}`.trim()
                : null
            }
          />
          <Detail
            label="Lease expiry"
            value={data.lease_expiry ? formatDate(data.lease_expiry) : null}
          />
          <Detail
            label="Deposit target"
            value={`${data.deposit_target_months} month(s)`}
          />
          <Detail label="Land rent" value={data.land_rent_status} />
          <Detail label="Rates" value={data.rates_status} />
          <Detail
            label="Monthly rent"
            value={formatCurrency(data.monthly_rent_kes ?? 0)}
          />
          <Detail
            label="Deposits held"
            value={formatCurrency(data.deposits_kes ?? 0)}
          />
        </dl>
        {data.notes ? (
          <p className="mt-5 border-t pt-4 text-sm text-muted-foreground">
            {data.notes}
          </p>
        ) : null}
      </Card>

      <Card className="gap-0 rounded-2xl p-0">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-heading text-lg font-semibold">Units</h2>
            <p className="text-sm text-muted-foreground">
              Rentable units on this property.
            </p>
          </div>
          {canManage ? (
            <Button
              className="h-9 rounded-full px-4"
              onClick={() => {
                setUnit(undefined)
                setDialog("unit")
              }}
            >
              <PlusIcon />
              Add unit
            </Button>
          ) : null}
        </div>

        {units.isPending ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">Loading…</p>
        ) : units.isError ? (
          <p className="px-5 py-8 text-sm text-destructive">
            {getErrorMessage(units.error, "Couldn't load the units.")}
          </p>
        ) : (units.data ?? []).length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-sm text-muted-foreground">
            <DoorOpenIcon className="size-5 text-brand-ink" />
            No units yet.
          </div>
        ) : (
          <ul className="divide-y">
            {(units.data ?? []).map((item) => (
              <li
                key={item.unit_id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.bedrooms ?? "—"} bedroom(s) ·{" "}
                    {item.status === "UnderMaintenance"
                      ? "Under maintenance"
                      : item.status}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {item.default_rent_kes
                        ? formatCurrency(item.default_rent_kes)
                        : item.default_rent_usd
                          ? formatCurrency(item.default_rent_usd, "USD")
                          : "No rent set"}
                    </p>
                  </div>
                  {canManage ? (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                        onClick={() => {
                          setUnit(item)
                          setDialog("unit")
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-destructive"
                        onClick={() => setDeleteUnit(item)}
                      >
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <PropertyDialog
        open={dialog === "property"}
        onOpenChange={(next) => !next && setDialog(null)}
        property={data}
      />
      <DeletePropertyDialog
        open={dialog === "delete"}
        onOpenChange={(next) => !next && setDialog(null)}
        property={data}
        onDeleted={() => router.replace("/property/properties")}
      />
      <UnitDialog
        open={dialog === "unit"}
        onOpenChange={(next) => !next && setDialog(null)}
        propertyId={propertyId}
        unit={unit}
      />
      <DeleteUnitDialog
        open={Boolean(deleteUnit)}
        onOpenChange={(next) => !next && setDeleteUnit(undefined)}
        unit={deleteUnit}
      />
    </div>
  )
}

function Detail({
  label,
  value,
}: {
  label: string
  value: string | number | null | undefined
}) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">
        {value === null || value === undefined || value === "" ? "—" : value}
      </dd>
    </div>
  )
}
