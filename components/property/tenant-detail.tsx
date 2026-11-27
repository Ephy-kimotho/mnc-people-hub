"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CarIcon,
  ExternalLinkIcon,
  Loader2Icon,
  PaperclipIcon,
  PenLineIcon,
  PlusIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UploadCloudIcon,
  UserIcon,
} from "lucide-react"
import Link from "next/link"
import { useRef, useState } from "react"
import toast from "react-hot-toast"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TenantDialog } from "@/components/property/tenant-dialog"
import { TenantDocumentDialog } from "@/components/property/tenant-document-dialog"
import { TenantVehicleDialog } from "@/components/property/tenant-vehicle-dialog"
import {
  useTenant,
  useTenantDocuments,
  useTenantVehicles,
} from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import {
  deleteTenantDocument,
  deleteTenantVehicle,
  fetchTenantDocumentUrl,
  propertyKeys,
  updateTenant,
  uploadTenantPhoto,
} from "@/lib/api/properties"
import { formatCurrency, formatDate, formatFileSize } from "@/lib/format"
import { canManageProperty } from "@/lib/permissions"
import type { Tenant } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

const statusTone: Record<string, string> = {
  Active:
    "border-emerald-700/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  Inactive: "border-border bg-muted text-muted-foreground",
  Blacklisted: "border-destructive/30 bg-destructive/10 text-destructive",
}

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

function completenessOf(tenant: Tenant) {
  const fields = [
    tenant.full_name || tenant.company_name,
    tenant.mobile,
    tenant.phone,
    tenant.email,
    tenant.id_type,
    tenant.id_number,
    tenant.kra_pin,
    tenant.date_of_birth,
    tenant.employer,
    tenant.next_of_kin_name,
    tenant.next_of_kin_phone,
    tenant.next_of_kin_relationship,
    tenant.emergency_contact_name,
    tenant.emergency_contact_phone,
    tenant.emergency_contact_relationship,
  ]
  const filled = fields.filter(Boolean).length
  return Math.round((filled / fields.length) * 100)
}

export function TenantDetail({ tenantId }: { tenantId: string }) {
  const { user } = useAuth()
  const canManage = canManageProperty(user)
  const query = useTenant(tenantId)
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const archive = useMutation({
    mutationFn: (status: string) => updateTenant(tenantId, { status }),
    onSuccess: (_data, status) => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success(status === "Inactive" ? "Tenant archived" : "Tenant reactivated")
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't update the tenant status.")),
  })

  const documents = useTenantDocuments(tenantId)
  const vehicles = useTenantVehicles(tenantId)
  const [docOpen, setDocOpen] = useState(false)
  const [docCategory, setDocCategory] = useState<string>()
  const [vehicleOpen, setVehicleOpen] = useState(false)
  const [openingDoc, setOpeningDoc] = useState<string>()

  const removeDocument = useMutation({
    mutationFn: (id: string) => deleteTenantDocument(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Document deleted")
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't delete the document.")),
  })

  const removeVehicle = useMutation({
    mutationFn: (id: string) => deleteTenantVehicle(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Vehicle removed")
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't remove the vehicle.")),
  })

  function openDoc(category?: string) {
    setDocCategory(category)
    setDocOpen(true)
  }

  async function openDocument(documentId: string) {
    setOpeningDoc(documentId)
    try {
      const { url } = await fetchTenantDocumentUrl(documentId)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't open the document."))
    } finally {
      setOpeningDoc(undefined)
    }
  }

  if (query.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
        <p className="text-sm text-muted-foreground">
          {getErrorMessage(query.error, "Couldn't load this tenant.")}
        </p>
        <Button asChild variant="outline" className="h-10 rounded-full px-5">
          <Link href="/property/tenants">Back to tenants</Link>
        </Button>
      </div>
    )
  }

  const tenant = query.data
  const name = displayName(tenant)
  const completeness = completenessOf(tenant)
  const isActive = tenant.status === "Active"

  async function onPickPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadTenantPhoto(tenantId, file)
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Photo updated")
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't upload the photo."))
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/property/tenants"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Back to Tenants
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1">
            {tenant.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.photo_url}
                alt={name}
                className="size-16 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-16 items-center justify-center rounded-full bg-emerald-50 font-heading text-xl font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                {initials(name) || "T"}
              </span>
            )}
            {canManage ? (
              <>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {uploading ? "Uploading…" : "Edit photo"}
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={onPickPhoto}
                />
              </>
            ) : null}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                {name}
              </h1>
              <Badge
                variant="outline"
                className={`rounded-full ${statusTone[tenant.status] ?? ""}`}
              >
                {tenant.status}
              </Badge>
            </div>
            <p className="text-sm capitalize text-muted-foreground">
              {tenant.type}
            </p>
          </div>
        </div>

        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="h-10 rounded-full px-5"
              onClick={() => setEditOpen(true)}
            >
              <PenLineIcon />
              Edit Tenant Details
            </Button>
            <Button
              variant={isActive ? "destructive" : "outline"}
              className="h-10 rounded-full px-5"
              disabled={archive.isPending}
              onClick={() => archive.mutate(isActive ? "Inactive" : "Active")}
            >
              {archive.isPending && <Loader2Icon className="animate-spin" />}
              {isActive ? "Archive" : "Reactivate"}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="gap-3 rounded-2xl p-5 shadow-xs">
          <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            <UserIcon className="size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Current unit
            </p>
            <p className="mt-1 font-heading text-lg font-bold">
              {tenant.property_alias || "No unit"}
            </p>
            {tenant.unit_label ? (
              <p className="text-sm text-muted-foreground">{tenant.unit_label}</p>
            ) : null}
          </div>
        </Card>

        <Card className="gap-3 rounded-2xl p-5 shadow-xs">
          <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            <CalendarDaysIcon className="size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Lease status
            </p>
            <div className="mt-1">
              {tenant.lease_status ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-emerald-700/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                >
                  {tenant.lease_status}
                </Badge>
              ) : (
                <p className="font-heading text-lg font-bold text-muted-foreground">
                  No lease
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="gap-3 rounded-2xl p-5 shadow-xs">
          <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            <ShieldCheckIcon className="size-5" />
          </span>
          <div className="w-full">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Profile completeness
              </p>
              <p className="font-heading text-lg font-bold">{completeness}%</p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      <Card className="@container gap-0 rounded-2xl py-0 shadow-xs">
        <Tabs defaultValue="statutory" className="gap-0">
          <div className="overflow-x-auto border-b px-4">
            <TabsList
              variant="line"
              className="gap-2 pb-1 group-data-horizontal/tabs:h-13"
            >
              <TabsTrigger value="statutory" className="px-3">
                Statutory Profile
              </TabsTrigger>
              <TabsTrigger value="lease" className="px-3">
                Lease &amp; Deposits
              </TabsTrigger>
              <TabsTrigger value="documents" className="px-3">
                Documents
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="statutory" className="p-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="gap-5 rounded-2xl p-6">
                <h2 className="font-heading text-lg font-semibold">
                  Identification
                </h2>

                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <ShieldCheckIcon className="size-4" />
                    Protected statutory identity
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Field
                      label="ID type"
                      value={tenant.id_type}
                      empty="NOT PROVIDED"
                    />
                    <Field
                      label="ID / registration number"
                      value={tenant.id_number}
                      empty="Not provided"
                    />
                    <Field
                      label="KRA PIN"
                      value={tenant.kra_pin}
                      empty="Not provided"
                    />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    ID/passport numbers are shown in full here and encrypted when
                    stored. KRA PIN remains masked.
                  </p>
                </div>

                {canManage ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="h-9 rounded-full px-4"
                      onClick={() => openDoc("ID/Passport")}
                    >
                      <UploadCloudIcon />
                      Upload ID / Passport
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9 rounded-full px-4"
                      onClick={() => openDoc("Employer Letter")}
                    >
                      <UploadCloudIcon />
                      Upload Employer Letter
                    </Button>
                  </div>
                ) : null}

                <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
                  <Field label="Mobile" value={tenant.mobile} />
                  <Field label="Alternative phone" value={tenant.phone} />
                  <Field label="Email" value={tenant.email} />
                  <Field label="Employer / occupation" value={tenant.employer} />
                  <Field
                    label="Date of birth"
                    value={
                      tenant.date_of_birth
                        ? formatDate(tenant.date_of_birth)
                        : null
                    }
                  />
                  <Field label="Consent recorded" value={tenant.consent ? "Yes" : "No"} />
                </div>

                <div className="border-t pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 font-heading text-base font-semibold">
                      <CarIcon className="size-4 text-muted-foreground" />
                      Vehicles
                    </p>
                    {canManage ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full px-3"
                        onClick={() => setVehicleOpen(true)}
                      >
                        <PlusIcon />
                        Add Vehicle
                      </Button>
                    ) : null}
                  </div>
                  {vehicles.isPending ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Loading…
                    </p>
                  ) : vehicles.isError ? (
                    <p className="mt-3 text-sm text-destructive">
                      {getErrorMessage(
                        vehicles.error,
                        "Couldn't load the vehicles."
                      )}
                    </p>
                  ) : (vehicles.data ?? []).length === 0 ? (
                    <p className="mt-3 rounded-xl border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
                      No vehicles registered for this tenant.
                    </p>
                  ) : (
                    <ul className="mt-3 divide-y rounded-xl border">
                      {(vehicles.data ?? []).map((vehicle) => (
                        <li
                          key={vehicle.vehicle_id}
                          className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {vehicle.make}
                              {vehicle.model ? ` ${vehicle.model}` : ""}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {vehicle.registration_number}
                              {vehicle.colour ? ` · ${vehicle.colour}` : ""}
                            </p>
                          </div>
                          {canManage ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full text-destructive"
                              disabled={removeVehicle.isPending}
                              onClick={() =>
                                removeVehicle.mutate(vehicle.vehicle_id)
                              }
                            >
                              {removeVehicle.isPending ? (
                                <Loader2Icon className="animate-spin" />
                              ) : (
                                <Trash2Icon />
                              )}
                              Remove
                            </Button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>

              <Card className="gap-0 rounded-2xl p-0">
                <div className="border-b px-6 py-4">
                  <h2 className="font-heading text-lg font-semibold">
                    Emergency &amp; Next of Kin
                  </h2>
                </div>
                <div className="divide-y">
                  <div className="px-6 py-5">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Next of kin
                    </p>
                    {tenant.next_of_kin_name || tenant.next_of_kin_phone ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <Field label="Name" value={tenant.next_of_kin_name} />
                        <Field label="Phone" value={tenant.next_of_kin_phone} />
                        <Field
                          label="Relationship"
                          value={tenant.next_of_kin_relationship}
                        />
                      </div>
                    ) : (
                      <p className="mt-2 text-sm italic text-muted-foreground">
                        Not provided
                      </p>
                    )}
                  </div>
                  <div className="px-6 py-5">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Emergency contact
                    </p>
                    {tenant.emergency_contact_name ||
                    tenant.emergency_contact_phone ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <Field
                          label="Name"
                          value={tenant.emergency_contact_name}
                        />
                        <Field
                          label="Phone"
                          value={tenant.emergency_contact_phone}
                        />
                        <Field
                          label="Relationship"
                          value={tenant.emergency_contact_relationship}
                        />
                      </div>
                    ) : (
                      <p className="mt-2 text-sm italic text-muted-foreground">
                        Not provided
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="lease" className="p-5">
            {tenant.lease_id ? (
              <Card className="gap-0 rounded-2xl p-0">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
                  <div>
                    <h2 className="font-heading text-lg font-semibold">
                      Lease &amp; deposits
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {tenant.property_alias} · {tenant.unit_label}
                    </p>
                  </div>
                  {tenant.property_id ? (
                    <Button asChild variant="outline" className="h-9 rounded-full px-4">
                      <Link
                        href={`/property/properties/${tenant.property_id}`}
                      >
                        View Property
                        <ExternalLinkIcon />
                      </Link>
                    </Button>
                  ) : null}
                </div>
                <dl className="grid gap-5 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Status" value={tenant.lease_status} />
                  <Field
                    label="Start date"
                    value={
                      tenant.start_date ? formatDate(tenant.start_date) : null
                    }
                  />
                  <Field
                    label="End date"
                    value={tenant.end_date ? formatDate(tenant.end_date) : null}
                  />
                  <Field
                    label="Monthly rent (KES)"
                    value={formatCurrency(tenant.monthly_rent_kes ?? 0)}
                  />
                  <Field
                    label="Monthly rent (USD)"
                    value={formatCurrency(tenant.monthly_rent_usd ?? 0, "USD")}
                  />
                  <Field
                    label="Service charge (KES)"
                    value={formatCurrency(tenant.service_charge_kes ?? 0)}
                  />
                  <Field
                    label="Deposit held (KES)"
                    value={formatCurrency(tenant.deposit_kes ?? 0)}
                  />
                  <Field
                    label="Deposit held (USD)"
                    value={formatCurrency(tenant.deposit_usd ?? 0, "USD")}
                  />
                </dl>
              </Card>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
                <CalendarDaysIcon className="size-5 text-emerald-800" />
                No lease on file for this tenant.
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="p-5">
            <Card className="gap-0 rounded-2xl p-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
                <div>
                  <h2 className="font-heading text-lg font-semibold">
                    Documents
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    ID/passport scans, employer letters, contracts and other
                    files.
                  </p>
                </div>
                {canManage ? (
                  <Button
                    className="h-9 rounded-full bg-emerald-800 px-4 text-white hover:bg-emerald-900"
                    onClick={() => openDoc()}
                  >
                    <UploadCloudIcon />
                    Upload document
                  </Button>
                ) : null}
              </div>

              {documents.isPending ? (
                <Skeleton className="m-5 h-16 rounded-xl" />
              ) : documents.isError ? (
                <p className="px-5 py-8 text-sm text-destructive">
                  {getErrorMessage(
                    documents.error,
                    "Couldn't load the documents."
                  )}
                </p>
              ) : (documents.data ?? []).length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-sm text-muted-foreground">
                  <PaperclipIcon className="size-5 text-emerald-800" />
                  No documents uploaded yet. Add ID/passport scans and employer
                  letters here.
                </div>
              ) : (
                <ul className="divide-y">
                  {(documents.data ?? []).map((document) => (
                    <li
                      key={document.document_id}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{document.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {document.category} · {formatDate(document.uploaded_at)}
                          {document.file_size_bytes
                            ? ` · ${formatFileSize(document.file_size_bytes)}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full"
                          disabled={openingDoc === document.document_id}
                          onClick={() => openDocument(document.document_id)}
                        >
                          {openingDoc === document.document_id ? (
                            <Loader2Icon className="animate-spin" />
                          ) : (
                            <ExternalLinkIcon />
                          )}
                          View
                        </Button>
                        {canManage ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full text-destructive"
                            disabled={removeDocument.isPending}
                            onClick={() =>
                              removeDocument.mutate(document.document_id)
                            }
                          >
                            {removeDocument.isPending ? (
                              <Loader2Icon className="animate-spin" />
                            ) : (
                              <Trash2Icon />
                            )}
                            Delete
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </Card>

      <TenantDocumentDialog
        open={docOpen}
        onOpenChange={setDocOpen}
        tenantId={tenantId}
        defaultCategory={docCategory}
      />
      <TenantVehicleDialog
        open={vehicleOpen}
        onOpenChange={setVehicleOpen}
        tenantId={tenantId}
      />
      <TenantDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        tenant={tenant}
      />
    </div>
  )
}

function Field({
  label,
  value,
  empty,
}: {
  label: string
  value: string | null | undefined
  empty?: string
}) {
  return (
    <div>
      <dt className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">
        {value ? value : (empty ?? "—")}
      </dd>
    </div>
  )
}
