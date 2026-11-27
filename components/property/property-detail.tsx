"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckIcon,
  DoorOpenIcon,
  EllipsisVerticalIcon,
  ExternalLinkIcon,
  FileTextIcon,
  LandmarkIcon,
  Loader2Icon,
  MapPinIcon,
  PenLineIcon,
  PercentIcon,
  PlusIcon,
  WrenchIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import toast from "react-hot-toast"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DeleteLeaseDialog } from "@/components/property/delete-lease-dialog"
import { DeletePropertyDialog } from "@/components/property/delete-property-dialog"
import { DeleteUnitDialog } from "@/components/property/delete-unit-dialog"
import { LeaseDialog } from "@/components/property/lease-dialog"
import { MaintenanceDialog } from "@/components/property/maintenance-dialog"
import { PropertyDialog } from "@/components/property/property-dialog"
import { PropertyDocumentsTab } from "@/components/property/property-documents-tab"
import { PropertyInsuranceTab } from "@/components/property/property-insurance-tab"
import { PropertyOwnershipTab } from "@/components/property/property-ownership-tab"
import { PropertyServiceChargesTab } from "@/components/property/property-service-charges-tab"
import { RentPaymentDialog } from "@/components/property/rent-payment-dialog"
import { UnitDialog } from "@/components/property/unit-dialog"
import {
  useLeases,
  useMaintenance,
  useProperty,
  useRentCollection,
  useUnits,
} from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import {
  deleteMaintenance,
  propertyKeys,
  resolveMaintenance,
  updateProperty,
} from "@/lib/api/properties"
import { formatCurrency, formatDate } from "@/lib/format"
import { canManageProperty } from "@/lib/permissions"
import type { Lease, Maintenance, Property, PropertyUnit, RentCollection } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

function propertyStatus(property: Property) {
  if (property.status === "Sold") return "Sold"
  if (property.status === "For Sale") return "For Sale"
  if (property.status === "Under Consideration") return "Under Consideration"
  if (property.status === "Inactive") return "Inactive"
  return (property.occupied_count ?? 0) > 0 ? "Let" : "Active"
}

const statusTones: Record<string, string> = {
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

export function PropertyDetail({ propertyId }: { propertyId: string }) {
  const router = useRouter()
  const { user } = useAuth()
  const canManage = canManageProperty(user)
  const isAdmin = user?.role === "admin"
  const property = useProperty(propertyId)
  const units = useUnits(propertyId)
  const leases = useLeases({ property_id: propertyId })
  const queryClient = useQueryClient()

  const archive = useMutation({
    mutationFn: (status: string) => updateProperty(propertyId, { status }),
    onSuccess: (_data, status) => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success(
        status === "Inactive" ? "Property archived" : "Property reactivated"
      )
    },
    onError: (error) =>
      toast.error(
        getErrorMessage(error, "Couldn't update the property status.")
      ),
  })

  const [dialog, setDialog] = useState<
    "property" | "delete" | "unit" | "lease" | null
  >(null)
  const [unit, setUnit] = useState<PropertyUnit>()
  const [deleteUnit, setDeleteUnit] = useState<PropertyUnit>()
  const [lease, setLease] = useState<Lease>()
  const [deleteLease, setDeleteLease] = useState<Lease>()

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
  const occupied = data.occupied_count ?? 0
  const total = data.unit_count ?? 0
  const occupancyPct = total ? Math.round((occupied / total) * 100) : 0
  const status = propertyStatus(data)
  const statusTone = statusTones[status] ?? statusTones.Active
  const archived = data.status === "Inactive"

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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-10 rounded-full px-5"
                onClick={() => setDialog("property")}
              >
                Edit property
              </Button>
              <Button
                variant={archived ? "outline" : "destructive"}
                className="h-10 rounded-full px-5"
                disabled={archive.isPending}
                onClick={() =>
                  archive.mutate(archived ? "Active" : "Inactive")
                }
              >
                {archive.isPending && <Loader2Icon className="animate-spin" />}
                {archived ? "Reactivate" : "Archive"}
              </Button>
              {isAdmin ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full"
                    >
                      <EllipsisVerticalIcon />
                      <span className="sr-only">More property actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setDialog("delete")}
                    >
                      Delete property
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          )
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className={`rounded-full ${statusTone}`}>
          {status}
        </Badge>
        {data.tenure ? <Badge variant="outline">{data.tenure}</Badge> : null}
        <Badge variant="outline">{data.completeness}% complete</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={LandmarkIcon}
          label="Title number"
          value={data.title_number || "—"}
          note={
            data.title_deed_name
              ? `Deed: ${data.title_deed_name}`
              : "Deed name not recorded"
          }
        />
        <StatCard
          icon={DoorOpenIcon}
          label="Occupancy"
          value={`${occupancyPct}%`}
          note={`${occupied} of ${total} units occupied`}
          progress={occupancyPct}
        />
        <StatCard
          icon={CalendarDaysIcon}
          label="Monthly rent"
          value={formatCurrency(data.monthly_rent_kes ?? 0)}
          note={`+ ${formatCurrency(data.monthly_rent_usd ?? 0, "USD")}`}
        />
        <StatCard
          icon={PercentIcon}
          label="Completeness"
          value={`${data.completeness}%`}
          note="Profile completeness"
          progress={data.completeness}
        />
      </div>

      <Card className="@container gap-0 rounded-2xl py-0 shadow-xs">
        <Tabs defaultValue="details" className="gap-0">
          <div className="overflow-x-auto border-b px-4">
            <TabsList
              variant="line"
              className="gap-2 pb-1 group-data-horizontal/tabs:h-13"
            >
              {[
                ["details", "Details & Compliance"],
                ["documents", "Documents"],
                ["insurance", "Insurance"],
                ["maintenance", "Maintenance"],
                ["service", "Service Charges"],
                ["rent", "Rent Collection"],
                ["units", "Units & Leases"],
                ["ownership", "Ownership & Contacts"],
              ].map(([value, label]) => (
                <TabsTrigger key={value} value={value} className="px-3">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="details" className="p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="space-y-4">
                <Card className="gap-4 rounded-2xl p-6">
                  <h2 className="font-heading text-lg font-semibold">
                    Property information
                  </h2>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <Detail label="Tenure" value={data.tenure} />
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
                      value={
                        data.lease_expiry
                          ? formatDate(data.lease_expiry)
                          : null
                      }
                    />
                    <div>
                      <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Deposit target
                      </dt>
                      <dd className="mt-1 flex items-center gap-2 text-sm font-medium">
                        {data.deposit_target_months} month(s)
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 rounded-full px-2"
                          onClick={() => setDialog("property")}
                        >
                          <PenLineIcon />
                          Edit
                        </Button>
                      </dd>
                    </div>
                  </dl>
                  <dl className="grid gap-4 border-t pt-4 sm:grid-cols-3">
                    <Detail
                      label="Deposits held"
                      value={formatCurrency(data.deposits_kes ?? 0)}
                    />
                    <Detail
                      label="Service charge"
                      value={formatCurrency(data.service_charge_kes ?? 0)}
                    />
                    <Detail
                      label="Monthly rent"
                      value={formatCurrency(data.monthly_rent_kes ?? 0)}
                    />
                  </dl>
                </Card>

                <Card className="gap-4 rounded-2xl p-6">
                  <h2 className="font-heading text-lg font-semibold">
                    Compliance &amp; status
                  </h2>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <Detail
                      label="Land rent"
                      value={data.land_rent_status || "Unknown"}
                    />
                    <Detail
                      label="County rates"
                      value={data.rates_status || "Unknown"}
                    />
                  </dl>
                  <p className="text-xs text-muted-foreground">
                    Update these from Edit property.
                  </p>
                </Card>

                {data.notes ? (
                  <Card className="gap-2 rounded-2xl p-6">
                    <h2 className="font-heading text-lg font-semibold">
                      Internal notes
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {data.notes}
                    </p>
                  </Card>
                ) : null}
              </div>

              <LocationCard
                property={data}
                onEdit={() => setDialog("property")}
              />
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <PropertyDocumentsTab
              property={data}
              propertyId={propertyId}
              canManage={canManage}
            />
          </TabsContent>

          <TabsContent value="insurance">
            <PropertyInsuranceTab
              propertyId={propertyId}
              canManage={canManage}
            />
          </TabsContent>

          <TabsContent value="maintenance">
            <MaintenancePanel propertyId={propertyId} canManage={canManage} />
          </TabsContent>

          <TabsContent value="service">
            <PropertyServiceChargesTab
              property={data}
              propertyId={propertyId}
            />
          </TabsContent>

          <TabsContent value="rent">
            <RentPanel propertyAlias={data.alias} canManage={canManage} />
          </TabsContent>

          <TabsContent value="units">
            <div className="space-y-4 p-5">
              <UnitsCard
                canManage={canManage}
                units={units}
                onAddUnit={() => {
                  setUnit(undefined)
                  setDialog("unit")
                }}
                onEditUnit={(item) => {
                  setUnit(item)
                  setDialog("unit")
                }}
                onDeleteUnit={setDeleteUnit}
              />

              <LeasesCard
                canManage={canManage}
                leases={leases}
                onAddLease={() => {
                  setLease(undefined)
                  setDialog("lease")
                }}
                onEditLease={(item) => {
                  setLease(item)
                  setDialog("lease")
                }}
                onDeleteLease={setDeleteLease}
              />
            </div>
          </TabsContent>

          <TabsContent value="ownership">
            <PropertyOwnershipTab
              propertyId={propertyId}
              canManage={canManage}
            />
          </TabsContent>
        </Tabs>
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
      <LeaseDialog
        open={dialog === "lease"}
        onOpenChange={(next) => !next && setDialog(null)}
        lease={lease}
      />
      <DeleteLeaseDialog
        open={Boolean(deleteLease)}
        onOpenChange={(next) => !next && setDeleteLease(undefined)}
        lease={deleteLease}
      />
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  note,
  progress,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  note?: string
  progress?: number
}) {
  return (
    <Card className="gap-3 rounded-2xl p-5 shadow-xs">
      <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <p className="mt-1 truncate font-heading text-2xl font-bold">{value}</p>
        {progress !== undefined ? (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-600"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        ) : null}
        {note ? (
          <p className="mt-1 text-xs text-muted-foreground">{note}</p>
        ) : null}
      </div>
    </Card>
  )
}

function LocationCard({
  property,
  onEdit,
}: {
  property: Property
  onEdit: () => void
}) {
  const mapsUrl =
    property.google_maps_url ||
    (property.latitude != null && property.longitude != null
      ? `https://www.google.com/maps?q=${property.latitude},${property.longitude}`
      : null)
  const coordinates =
    property.latitude != null && property.longitude != null
      ? `${property.latitude}, ${property.longitude}`
      : null

  return (
    <Card className="gap-0 self-start rounded-2xl p-0">
      <div className="flex items-center justify-between gap-2 border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <MapPinIcon className="size-4 text-emerald-800" />
          <h2 className="font-heading text-lg font-semibold">Location</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-full px-3"
          onClick={onEdit}
        >
          <PenLineIcon />
          Edit
        </Button>
      </div>
      <div className="px-6 py-5">
        <p className="text-sm">
          {[property.location, property.county].filter(Boolean).join(", ") ||
            "No location set"}
        </p>
        {coordinates ? (
          <p className="mt-1 text-xs text-muted-foreground">{coordinates}</p>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed px-4 py-5 text-center">
            <MapPinIcon className="mx-auto size-5 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">
              Exact map pin not added yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add latitude and longitude to show this property on the map.
            </p>
          </div>
        )}
        {mapsUrl ? (
          <Button
            asChild
            variant="outline"
            className="mt-4 h-10 rounded-full px-5"
          >
            <a href={mapsUrl} target="_blank" rel="noreferrer">
              <ExternalLinkIcon />
              Open in Google Maps
            </a>
          </Button>
        ) : null}
      </div>
    </Card>
  )
}

function MaintenancePanel({
  propertyId,
  canManage,
}: {
  propertyId: string
  canManage: boolean
}) {
  const queryClient = useQueryClient()
  const query = useMaintenance({ property_id: propertyId })
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState<Maintenance>()

  const resolve = useMutation({
    mutationFn: (id: string) => resolveMaintenance(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Marked as resolved")
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't resolve it.")),
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteMaintenance(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Maintenance record deleted")
      setDeleting(undefined)
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't delete it.")),
  })

  const priorityTone: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-emerald-50 text-emerald-800",
    high: "bg-warning/15 text-warning",
    urgent: "bg-destructive/10 text-destructive",
  }

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Repairs, maintenance jobs and complaints for this property.
        </p>
        {canManage ? (
          <Button
            className="h-10 rounded-full px-5"
            onClick={() => setOpen(true)}
          >
            <PlusIcon />
            Log request
          </Button>
        ) : null}
      </div>

      {query.isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(query.error, "Couldn't load maintenance.")}
        </p>
      ) : (query.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          <WrenchIcon className="size-5 text-emerald-800" />
          No maintenance records for this property.
        </div>
      ) : (
        <ul className="divide-y rounded-2xl border">
          {(query.data ?? []).map((item) => (
            <li
              key={item.maintenance_id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {item.kind}
                  {item.category ? ` · ${item.category}` : ""}
                  {item.unit_label ? ` · ${item.unit_label}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${priorityTone[item.priority] ?? "bg-muted"}`}
                >
                  {item.priority}
                </span>
                <Badge
                  variant={item.status === "Resolved" ? "secondary" : "outline"}
                >
                  {item.status}
                </Badge>
                {canManage && item.status !== "Resolved" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    disabled={resolve.isPending}
                    onClick={() => resolve.mutate(item.maintenance_id)}
                  >
                    {resolve.isPending ? (
                      <Loader2Icon className="animate-spin" />
                    ) : (
                      <CheckIcon />
                    )}
                    Resolve
                  </Button>
                ) : null}
                {canManage ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-destructive"
                    onClick={() => setDeleting(item)}
                  >
                    Delete
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <MaintenanceDialog
        open={open}
        onOpenChange={setOpen}
        defaultPropertyId={propertyId}
      />
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(undefined)}
      >
        <AlertDialogContent className="rounded-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              Delete {deleting?.title}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the maintenance record. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="-mx-6 -mb-6 px-6">
            <AlertDialogCancel className="h-10 rounded-xl px-5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                if (deleting) remove.mutate(deleting.maintenance_id)
              }}
              disabled={remove.isPending}
              variant="destructive"
              className="h-10 rounded-xl px-5"
            >
              {remove.isPending && <Loader2Icon className="animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function RentPanel({
  propertyAlias,
  canManage,
}: {
  propertyAlias: string
  canManage: boolean
}) {
  const now = new Date()
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const query = useRentCollection(period)
  const [paying, setPaying] = useState<RentCollection>()

  const rows = (query.data ?? []).filter(
    (row) => row.property_alias === propertyAlias
  )

  return (
    <div className="space-y-4 p-5">
      <p className="text-sm text-muted-foreground">
        Rent collected for {period}. This is the current collection period.
      </p>

      {query.isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(query.error, "Couldn't load rent collection.")}
        </p>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          <CalendarDaysIcon className="size-5 text-emerald-800" />
          No active leases to collect for this period.
        </div>
      ) : (
        <ul className="divide-y rounded-2xl border">
          {rows.map((row) => {
            const outstanding = Math.max(
              0,
              (row.expected_kes ?? 0) - (row.paid_kes ?? 0)
            )
            return (
              <li
                key={row.lease_id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {row.tenant_full_name ||
                      row.tenant_company_name ||
                      "Tenant"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {row.unit_label ?? "Unit"} · expected{" "}
                    {formatCurrency(row.expected_kes ?? 0)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${outstanding > 0 ? "text-destructive" : "text-emerald-700"}`}
                    >
                      {outstanding > 0
                        ? formatCurrency(outstanding)
                        : "Paid in full"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      paid {formatCurrency(row.paid_kes ?? 0)}
                    </p>
                  </div>
                  {canManage ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => setPaying(row)}
                    >
                      Record
                    </Button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <RentPaymentDialog
        open={Boolean(paying)}
        onOpenChange={(next) => !next && setPaying(undefined)}
        row={paying}
        period={period}
      />
    </div>
  )
}

function UnitsCard({
  canManage,
  units,
  onAddUnit,
  onEditUnit,
  onDeleteUnit,
}: {
  canManage: boolean
  units: ReturnType<typeof useUnits>
  onAddUnit: () => void
  onEditUnit: (unit: PropertyUnit) => void
  onDeleteUnit: (unit: PropertyUnit) => void
}) {
  return (
    <Card className="gap-0 rounded-2xl p-0">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">Units</h2>
          <p className="text-sm text-muted-foreground">
            Rentable units on this property.
          </p>
        </div>
        {canManage ? (
          <Button className="h-9 rounded-full px-4" onClick={onAddUnit}>
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
          <DoorOpenIcon className="size-5 text-emerald-800" />
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
                      onClick={() => onEditUnit(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-destructive"
                      onClick={() => onDeleteUnit(item)}
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
  )
}

function LeasesCard({
  canManage,
  leases,
  onAddLease,
  onEditLease,
  onDeleteLease,
}: {
  canManage: boolean
  leases: ReturnType<typeof useLeases>
  onAddLease: () => void
  onEditLease: (lease: Lease) => void
  onDeleteLease: (lease: Lease) => void
}) {
  return (
    <Card className="gap-0 rounded-2xl p-0">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">Leases</h2>
          <p className="text-sm text-muted-foreground">
            Tenancies on this property.
          </p>
        </div>
        {canManage ? (
          <Button className="h-9 rounded-full px-4" onClick={onAddLease}>
            <PlusIcon />
            Add lease
          </Button>
        ) : null}
      </div>

      {leases.isPending ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">Loading…</p>
      ) : leases.isError ? (
        <p className="px-5 py-8 text-sm text-destructive">
          {getErrorMessage(leases.error, "Couldn't load the leases.")}
        </p>
      ) : (leases.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-sm text-muted-foreground">
          <FileTextIcon className="size-5 text-emerald-800" />
          No leases yet.
        </div>
      ) : (
        <ul className="divide-y">
          {(leases.data ?? []).map((lease) => (
            <li
              key={lease.lease_id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {lease.tenant_full_name ||
                    lease.tenant_company_name ||
                    "Tenant"}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {lease.unit_label} ·{" "}
                  {lease.start_date ? formatDate(lease.start_date) : "—"} to{" "}
                  {lease.end_date ? formatDate(lease.end_date) : "open"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {lease.monthly_rent_kes
                      ? formatCurrency(lease.monthly_rent_kes)
                      : lease.monthly_rent_usd
                        ? formatCurrency(lease.monthly_rent_usd, "USD")
                        : "No rent set"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Deposit {formatCurrency(lease.deposit_kes)}
                  </p>
                </div>
                <Badge
                  variant={lease.status === "Active" ? "secondary" : "outline"}
                >
                  {lease.status}
                </Badge>
                {canManage ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-full"
                      >
                        <EllipsisVerticalIcon />
                        <span className="sr-only">Lease actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onSelect={() => onEditLease(lease)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => onDeleteLease(lease)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
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
