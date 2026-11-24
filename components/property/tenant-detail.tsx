"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ExternalLinkIcon,
  Loader2Icon,
  PenLineIcon,
  ShieldCheckIcon,
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
import { useTenant } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import {
  propertyKeys,
  updateTenant,
  uploadTenantPhoto,
} from "@/lib/api/properties"
import { formatCurrency, formatDate } from "@/lib/format"
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
              <TabsTrigger value="documents" className="px-3" disabled>
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
                  <div className="mt-3 grid grid-cols-3 gap-3">
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
        </Tabs>
      </Card>

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
