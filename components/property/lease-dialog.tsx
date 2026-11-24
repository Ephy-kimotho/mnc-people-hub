"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon } from "lucide-react"
import toast from "react-hot-toast"
import { Controller, useForm } from "react-hook-form"
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
import { useProperties, useTenants, useUnits } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import {
  createLease,
  propertyKeys,
  updateLease,
} from "@/lib/api/properties"
import { leaseSchema, type LeaseInput } from "@/lib/schemas/property"
import type { Lease } from "@/lib/types"

const inputClass = "h-11 rounded-xl px-3.5"
const labelClass =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"

export function LeaseDialog({
  open,
  onOpenChange,
  lease,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  lease?: Lease
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            {lease ? "Edit lease" : "Add lease"}
          </DialogTitle>
          <DialogDescription>
            {lease
              ? "Update the rent, deposit, dates or status."
              : "Link a tenant to a unit and set the rent."}
          </DialogDescription>
        </DialogHeader>
        <LeaseForm lease={lease} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function LeaseForm({ lease, onDone }: { lease?: Lease; onDone: () => void }) {
  const queryClient = useQueryClient()
  const properties = useProperties()
  const tenants = useTenants()
  const form = useForm<z.input<typeof leaseSchema>, unknown, LeaseInput>({
    resolver: zodResolver(leaseSchema),
    defaultValues: {
      property_id: lease?.property_id ?? "",
      unit_id: lease?.unit_id ?? "",
      tenant_id: lease?.tenant_id ?? "",
      start_date: lease?.start_date ?? "",
      end_date: lease?.end_date ?? "",
      monthly_rent_kes: lease?.monthly_rent_kes ?? undefined,
      monthly_rent_usd: lease?.monthly_rent_usd ?? undefined,
      deposit_kes: lease?.deposit_kes ?? 0,
      deposit_usd: lease?.deposit_usd ?? 0,
      deposit_target_months: lease?.deposit_target_months ?? 2,
      service_charge_kes: lease?.service_charge_kes ?? undefined,
      service_charge_account_id: lease?.service_charge_account_id ?? "",
      rent_routing_account_id: lease?.rent_routing_account_id ?? "",
      notes: lease?.notes ?? "",
    },
  })
  const propertyId = form.watch("property_id")
  const units = useUnits(propertyId)

  const mutation = useMutation({
    mutationFn: (values: LeaseInput) =>
      lease ? updateLease(lease.lease_id, values) : createLease(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success(`Lease ${lease ? "updated" : "created"}`)
      onDone()
    },
    onError: (error) =>
      toast.error(
        getErrorMessage(
          error,
          lease ? "Couldn't update this lease." : "Couldn't create the lease."
        )
      ),
  })

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      noValidate
    >
      <fieldset
        disabled={mutation.isPending}
        className="grid max-h-[75vh] gap-4 overflow-y-auto px-6 py-5"
      >
        {!lease ? (
          <>
            <div className="grid gap-2">
              <FieldLabel htmlFor="lease-property" className={labelClass}>
                Property
              </FieldLabel>
              <select
                id="lease-property"
                className={inputClass}
                {...form.register("property_id")}
              >
                <option value="">Choose a property</option>
                {(properties.data ?? []).map((property) => (
                  <option
                    key={property.property_id}
                    value={property.property_id}
                  >
                    {property.alias}
                  </option>
                ))}
              </select>
              <FieldError>
                {form.formState.errors.property_id?.message}
              </FieldError>
            </div>

            <div className="grid gap-2">
              <FieldLabel htmlFor="lease-unit" className={labelClass}>
                Unit
              </FieldLabel>
              <select
                id="lease-unit"
                className={inputClass}
                disabled={!propertyId || units.isPending}
                {...form.register("unit_id")}
              >
                <option value="">
                  {propertyId ? "Choose a unit" : "Pick a property first"}
                </option>
                {(units.data ?? []).map((unit) => (
                  <option key={unit.unit_id} value={unit.unit_id}>
                    {unit.label}
                  </option>
                ))}
              </select>
              <FieldError>{form.formState.errors.unit_id?.message}</FieldError>
            </div>

            <div className="grid gap-2">
              <FieldLabel htmlFor="lease-tenant" className={labelClass}>
                Tenant
              </FieldLabel>
              <select
                id="lease-tenant"
                className={inputClass}
                {...form.register("tenant_id")}
              >
                <option value="">Choose a tenant</option>
                {(tenants.data ?? []).map((tenant) => (
                  <option key={tenant.tenant_id} value={tenant.tenant_id}>
                    {tenant.full_name || tenant.company_name || "Tenant"}
                  </option>
                ))}
              </select>
              <FieldError>
                {form.formState.errors.tenant_id?.message}
              </FieldError>
            </div>
          </>
        ) : (
          <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
            <p className="font-medium">
              {lease.tenant_full_name ||
                lease.tenant_company_name ||
                "Tenant"}
            </p>
            <p className="text-muted-foreground">
              {lease.property_alias} · {lease.unit_label}
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel className={labelClass}>Start date</FieldLabel>
            <Controller
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <DatePicker
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Not set"
                  className={inputClass}
                />
              )}
            />
          </div>
          <div className="grid gap-2">
            <FieldLabel className={labelClass}>End date</FieldLabel>
            <Controller
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <DatePicker
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Not set"
                  className={inputClass}
                />
              )}
            />
            <FieldError>{form.formState.errors.end_date?.message}</FieldError>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="lease-rent-kes" className={labelClass}>
              Monthly rent (KES)
            </FieldLabel>
            <Input
              id="lease-rent-kes"
              type="number"
              min="0"
              className={inputClass}
              {...form.register("monthly_rent_kes")}
            />
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="lease-rent-usd" className={labelClass}>
              Monthly rent (USD)
            </FieldLabel>
            <Input
              id="lease-rent-usd"
              type="number"
              min="0"
              className={inputClass}
              {...form.register("monthly_rent_usd")}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <FieldLabel htmlFor="lease-deposit" className={labelClass}>
              Deposit (KES)
            </FieldLabel>
            <Input
              id="lease-deposit"
              type="number"
              min="0"
              className={inputClass}
              {...form.register("deposit_kes")}
            />
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="lease-deposit-usd" className={labelClass}>
              Deposit (USD)
            </FieldLabel>
            <Input
              id="lease-deposit-usd"
              type="number"
              min="0"
              className={inputClass}
              {...form.register("deposit_usd")}
            />
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="lease-target" className={labelClass}>
              Deposit target
            </FieldLabel>
            <Input
              id="lease-target"
              type="number"
              min="1"
              max="12"
              className={inputClass}
              {...form.register("deposit_target_months")}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <FieldLabel htmlFor="lease-service-charge" className={labelClass}>
            Service charge (KES)
          </FieldLabel>
          <Input
            id="lease-service-charge"
            type="number"
            min="0"
            className={inputClass}
            {...form.register("service_charge_kes")}
          />
        </div>

        <div className="grid gap-2">
          <FieldLabel htmlFor="lease-notes" className={labelClass}>
            Notes
          </FieldLabel>
          <Textarea id="lease-notes" rows={3} {...form.register("notes")} />
        </div>
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
          className="h-10 rounded-xl px-5"
          disabled={mutation.isPending}
        >
          {mutation.isPending && <Loader2Icon className="animate-spin" />}
          {lease ? "Save changes" : "Create lease"}
        </Button>
      </DialogFooter>
    </form>
  )
}
