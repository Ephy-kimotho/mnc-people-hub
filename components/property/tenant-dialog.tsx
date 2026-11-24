"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon, UploadCloudIcon } from "lucide-react"
import { useRef, useState } from "react"
import {
  Controller,
  useForm,
  type UseFormRegisterReturn,
} from "react-hook-form"
import toast from "react-hot-toast"
import type { z } from "zod"

import { DatePicker } from "@/components/date-picker"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useProperties, useUnits } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import {
  createLease,
  createTenant,
  propertyKeys,
  updateTenant,
  uploadLeaseDocument,
} from "@/lib/api/properties"
import { tenantSchema, type TenantInput } from "@/lib/schemas/property"
import type { Tenant } from "@/lib/types"

const inputClass = "h-11 rounded-xl px-3.5"
const labelClass =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"

const idTypes = ["National ID", "Passport", "Driver's Licence", "Alien ID", "Other"]
const relationships = [
  "Spouse",
  "Parent",
  "Sibling",
  "Child",
  "Guardian",
  "Friend",
  "Colleague",
  "Other",
]

type Currency = "KES" | "USD"

export function TenantDialog({
  open,
  onOpenChange,
  tenant,
  defaultPropertyId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant?: Tenant
  defaultPropertyId?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            {tenant ? "Edit tenant details" : "Add tenant and assign unit"}
          </DialogTitle>
          <DialogDescription>
            {tenant
              ? "Update the tenant's contact, identification and next-of-kin details."
              : "Create the tenant profile and active lease together. Only vacant units can be assigned."}
          </DialogDescription>
        </DialogHeader>
        <TenantForm
          tenant={tenant}
          defaultPropertyId={defaultPropertyId}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function TenantForm({
  tenant,
  defaultPropertyId,
  onDone,
}: {
  tenant?: Tenant
  defaultPropertyId?: string
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const properties = useProperties()
  const [propertyId, setPropertyId] = useState(
    defaultPropertyId ?? tenant?.property_id ?? ""
  )
  const units = useUnits(propertyId)
  const [unitId, setUnitId] = useState(tenant?.unit_id ?? "")
  const [leaseStart, setLeaseStart] = useState("")
  const [leaseEnd, setLeaseEnd] = useState("")
  const [rentCurrency, setRentCurrency] = useState<Currency>("KES")
  const [monthlyRent, setMonthlyRent] = useState("")
  const [depositCurrency, setDepositCurrency] = useState<Currency>("KES")
  const [depositPaid, setDepositPaid] = useState("")
  const [file, setFile] = useState<File>()
  const fileInput = useRef<HTMLInputElement>(null)

  const form = useForm<z.input<typeof tenantSchema>, unknown, TenantInput>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      type: (tenant?.type as TenantInput["type"]) ?? "individual",
      full_name: tenant?.full_name ?? "",
      company_name: tenant?.company_name ?? "",
      mobile: tenant?.mobile ?? "",
      phone: tenant?.phone ?? "",
      email: tenant?.email ?? "",
      id_type: tenant?.id_type ?? "National ID",
      id_number: tenant?.id_number ?? "",
      kra_pin: tenant?.kra_pin ?? "",
      date_of_birth: tenant?.date_of_birth ?? "",
      employer: tenant?.employer ?? "",
      next_of_kin_name: tenant?.next_of_kin_name ?? "",
      next_of_kin_phone: tenant?.next_of_kin_phone ?? "",
      next_of_kin_relationship: tenant?.next_of_kin_relationship ?? "",
      emergency_contact_name: tenant?.emergency_contact_name ?? "",
      emergency_contact_phone: tenant?.emergency_contact_phone ?? "",
      emergency_contact_relationship:
        tenant?.emergency_contact_relationship ?? "",
      notes: tenant?.notes ?? "",
      consent: tenant?.consent ?? false,
    },
  })
  const type = form.watch("type")

  const mutation = useMutation({
    mutationFn: async (values: TenantInput) => {
      const saved = tenant
        ? await updateTenant(tenant.tenant_id, values)
        : await createTenant(values)

      // An existing tenant edits their profile only — no new lease here.
      if (tenant) return saved

      const rent = Number(monthlyRent)
      if (!propertyId || !unitId || !rent || rent <= 0) return saved

      const deposit = Number(depositPaid) || 0
      const lease = await createLease({
        property_id: propertyId,
        unit_id: unitId,
        tenant_id: saved.tenant_id,
        start_date: leaseStart || undefined,
        end_date: leaseEnd || undefined,
        monthly_rent_kes: rentCurrency === "KES" ? rent : undefined,
        monthly_rent_usd: rentCurrency === "USD" ? rent : undefined,
        deposit_kes: depositCurrency === "KES" ? deposit : 0,
        deposit_usd: depositCurrency === "USD" ? deposit : 0,
        deposit_target_months: 2,
        service_charge_account_id: undefined,
        rent_routing_account_id: undefined,
        notes: undefined,
      })

      if (file) {
        await uploadLeaseDocument(lease.lease_id, file)
      }
      return saved
    },
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success(
        `${values.full_name || values.company_name} has been ${
          tenant ? "updated" : "added"
        }`
      )
      onDone()
    },
    onError: (error) =>
      toast.error(
        getErrorMessage(
          error,
          tenant ? "Couldn't update this tenant." : "Couldn't add the tenant."
        )
      ),
  })

  function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0]
    if (!picked) return
    if (!["application/pdf", "image/jpeg", "image/png"].includes(picked.type)) {
      toast.error("Choose a PDF, JPEG or PNG file.")
      return
    }
    if (picked.size > 15 * 1024 * 1024) {
      toast.error("The file must be 15 MB or smaller.")
      return
    }
    setFile(picked)
  }

  function onSubmit(values: TenantInput) {
    if (!tenant) {
      if (!propertyId || !unitId) {
        toast.error("Select a property and a vacant unit to assign.")
        return
      }
      const rent = Number(monthlyRent)
      if (!rent || rent <= 0) {
        toast.error("Enter the monthly rent for the lease.")
        return
      }
      if (leaseStart && leaseEnd && leaseEnd <= leaseStart) {
        toast.error("The lease end date must be after the start date.")
        return
      }
    }
    mutation.mutate(values)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <fieldset
        disabled={mutation.isPending}
        className="grid max-h-[72vh] gap-5 overflow-y-auto px-6 py-5"
      >
        <Section title="Contact details">
          <div className="grid gap-2">
            <FieldLabel htmlFor="tenant-name" className={labelClass}>
              Full name or company name{" "}
              <span className="text-destructive">*</span>
            </FieldLabel>
            {type === "individual" ? (
              <Input
                id="tenant-name"
                placeholder="Jane Wanjiku"
                className={inputClass}
                {...form.register("full_name")}
              />
            ) : (
              <Input
                id="tenant-company"
                placeholder="Acme Holdings Ltd"
                className={inputClass}
                {...form.register("company_name")}
              />
            )}
            <FieldError>
              {form.formState.errors.full_name?.message ||
                form.formState.errors.company_name?.message}
            </FieldError>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <FieldLabel htmlFor="tenant-type" className={labelClass}>
                Tenant type <span className="text-destructive">*</span>
              </FieldLabel>
              <select
                id="tenant-type"
                className={inputClass}
                {...form.register("type")}
              >
                <option value="individual">Individual</option>
                <option value="company">Company</option>
              </select>
            </div>
            <Field label="Mobile" htmlFor="tenant-mobile">
              <Input
                id="tenant-mobile"
                placeholder="+254…"
                className={inputClass}
                {...form.register("mobile")}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Alternative phone" htmlFor="tenant-phone">
              <Input
                id="tenant-phone"
                placeholder="+254…"
                className={inputClass}
                {...form.register("phone")}
              />
            </Field>
            <Field
              label="Email"
              htmlFor="tenant-email"
              error={form.formState.errors.email?.message}
            >
              <Input
                id="tenant-email"
                type="email"
                placeholder="tenant@example.com"
                className={inputClass}
                {...form.register("email")}
              />
            </Field>
          </div>
        </Section>

        <Section title="Identification and personal details">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <FieldLabel htmlFor="tenant-id-type" className={labelClass}>
                ID type
              </FieldLabel>
              <select
                id="tenant-id-type"
                className={inputClass}
                {...form.register("id_type")}
              >
                {idTypes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <Field label="National ID number" htmlFor="tenant-id-number">
              <Input
                id="tenant-id-number"
                placeholder="Visible on tenant profile after saving"
                className={inputClass}
                {...form.register("id_number")}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="KRA PIN" htmlFor="tenant-kra">
              <Input
                id="tenant-kra"
                placeholder="Encrypted when saved"
                className={inputClass}
                {...form.register("kra_pin")}
              />
            </Field>
            <div className="grid gap-2">
              <FieldLabel className={labelClass}>Date of birth</FieldLabel>
              <Controller
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="mm/dd/yyyy"
                    className={inputClass}
                  />
                )}
              />
            </div>
          </div>

          <Field label="Employer / occupation" htmlFor="tenant-employer">
            <Input
              id="tenant-employer"
              placeholder="Optional"
              className={inputClass}
              {...form.register("employer")}
            />
          </Field>
        </Section>

        <Section title="Next of Kin">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="tenant-kin-name">
              <Input
                id="tenant-kin-name"
                placeholder="Full name"
                className={inputClass}
                {...form.register("next_of_kin_name")}
              />
            </Field>
            <Field label="Phone" htmlFor="tenant-kin-phone">
              <Input
                id="tenant-kin-phone"
                placeholder="+254…"
                className={inputClass}
                {...form.register("next_of_kin_phone")}
              />
            </Field>
          </div>
          <RelationshipSelect
            id="tenant-kin-relationship"
            label="Relationship"
            registration={form.register("next_of_kin_relationship")}
          />
        </Section>

        <Section title="Emergency Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="tenant-emergency-name">
              <Input
                id="tenant-emergency-name"
                placeholder="Full name"
                className={inputClass}
                {...form.register("emergency_contact_name")}
              />
            </Field>
            <Field label="Phone" htmlFor="tenant-emergency-phone">
              <Input
                id="tenant-emergency-phone"
                placeholder="+254…"
                className={inputClass}
                {...form.register("emergency_contact_phone")}
              />
            </Field>
          </div>
          <RelationshipSelect
            id="tenant-emergency-relationship"
            label="Relationship"
            registration={form.register("emergency_contact_relationship")}
          />
        </Section>

        {!tenant ? (
          <Section title="Property and lease assignment">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <FieldLabel htmlFor="tenant-property" className={labelClass}>
                  Property <span className="text-destructive">*</span>
                </FieldLabel>
                <select
                  id="tenant-property"
                  className={inputClass}
                  value={propertyId}
                  onChange={(event) => {
                    setPropertyId(event.target.value)
                    setUnitId("")
                  }}
                >
                  <option value="">Select property</option>
                  {(properties.data ?? []).map((property) => (
                    <option
                      key={property.property_id}
                      value={property.property_id}
                    >
                      {property.alias}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <FieldLabel htmlFor="tenant-unit" className={labelClass}>
                  Available unit <span className="text-destructive">*</span>
                </FieldLabel>
                <select
                  id="tenant-unit"
                  className={inputClass}
                  value={unitId}
                  disabled={!propertyId || units.isPending}
                  onChange={(event) => setUnitId(event.target.value)}
                >
                  <option value="">
                    {propertyId ? "Select vacant unit" : "Select property first"}
                  </option>
                  {(units.data ?? [])
                    .filter((unit) => unit.status === "Vacant")
                    .map((unit) => (
                      <option key={unit.unit_id} value={unit.unit_id}>
                        {unit.label}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DateField
                label="Lease start"
                value={leaseStart}
                onChange={setLeaseStart}
              />
              <DateField
                label="Lease end"
                value={leaseEnd}
                onChange={setLeaseEnd}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <FieldLabel htmlFor="tenant-rent-currency" className={labelClass}>
                  Rent currency
                </FieldLabel>
                <select
                  id="tenant-rent-currency"
                  className={inputClass}
                  value={rentCurrency}
                  onChange={(event) =>
                    setRentCurrency(event.target.value as Currency)
                  }
                >
                  <option value="KES">KES</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <Field
                label={`Monthly rent (${rentCurrency})`}
                htmlFor="tenant-rent"
              >
                <Input
                  id="tenant-rent"
                  type="number"
                  min="0"
                  placeholder="0"
                  className={inputClass}
                  value={monthlyRent}
                  onChange={(event) => setMonthlyRent(event.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <FieldLabel
                  htmlFor="tenant-deposit-currency"
                  className={labelClass}
                >
                  Deposit currency
                </FieldLabel>
                <select
                  id="tenant-deposit-currency"
                  className={inputClass}
                  value={depositCurrency}
                  onChange={(event) =>
                    setDepositCurrency(event.target.value as Currency)
                  }
                >
                  <option value="KES">KES</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <Field
                label={`Deposit paid (${depositCurrency})`}
                htmlFor="tenant-deposit"
              >
                <Input
                  id="tenant-deposit"
                  type="number"
                  min="0"
                  placeholder="0"
                  className={inputClass}
                  value={depositPaid}
                  onChange={(event) => setDepositPaid(event.target.value)}
                />
              </Field>
            </div>
          </Section>
        ) : null}

        {!tenant ? (
          <Section title="Lease Agreements (Optional)">
            <p className="text-sm text-muted-foreground">
              Upload scanned lease agreements or other related documents. These
              will be securely saved to the tenant&apos;s Documents section.
            </p>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center transition-colors hover:bg-muted/40"
            >
              <UploadCloudIcon className="size-6 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">Click to upload</span> or drag and
                drop
              </span>
              <span className="text-xs text-muted-foreground">
                PDF, JPEG, PNG up to 15 MB
              </span>
              {file ? (
                <span className="text-xs font-medium text-emerald-800">
                  {file.name}
                </span>
              ) : null}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,image/jpeg,image/png"
              className="hidden"
              onChange={onPickFile}
            />
          </Section>
        ) : null}

        <label className="flex items-start gap-3 rounded-xl border px-4 py-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5"
            {...form.register("consent")}
          />
          <span>
            Tenant consent to store and process these personal details has been
            recorded.
          </span>
        </label>

        {tenant ? (
          <div className="grid gap-2">
            <FieldLabel htmlFor="tenant-notes" className={labelClass}>
              Internal notes
            </FieldLabel>
            <Textarea
              id="tenant-notes"
              rows={3}
              {...form.register("notes")}
            />
          </div>
        ) : null}
      </fieldset>

      <DialogFooter className="border-t px-6 py-4">
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-xl px-5"
          onClick={onDone}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="h-10 rounded-xl bg-emerald-800 px-5 text-white hover:bg-emerald-900"
          disabled={mutation.isPending}
        >
          {mutation.isPending && <Loader2Icon className="animate-spin" />}
          {tenant ? "Save changes" : "Add tenant"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-4 border-t pt-5 first:border-t-0 first:pt-0">
      <p className="font-heading text-sm font-semibold">{title}</p>
      {children}
    </div>
  )
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <FieldLabel htmlFor={htmlFor} className={labelClass}>
        {label}
      </FieldLabel>
      {children}
      <FieldError>{error}</FieldError>
    </div>
  )
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-2">
      <FieldLabel className={labelClass}>{label}</FieldLabel>
      <DatePicker
        value={value}
        onChange={onChange}
        placeholder="mm/dd/yyyy"
        className={inputClass}
      />
    </div>
  )
}

function RelationshipSelect({
  id,
  label,
  registration,
}: {
  id: string
  label: string
  registration: UseFormRegisterReturn
}) {
  return (
    <div className="grid gap-2">
      <FieldLabel htmlFor={id} className={labelClass}>
        {label}
      </FieldLabel>
      <select id={id} className={inputClass} {...registration}>
        <option value="">Select relationship</option>
        {relationships.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}
