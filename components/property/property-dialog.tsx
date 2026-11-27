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
import { getErrorMessage } from "@/lib/api/errors"
import {
  createProperty,
  propertyKeys,
  updateProperty,
} from "@/lib/api/properties"
import { propertySchema, type PropertyInput } from "@/lib/schemas/property"
import type { Property } from "@/lib/types"

const inputClass = "h-11 rounded-xl px-3.5"
const labelClass =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"

const propertyTypes = ["Residential", "Commercial", "Industrial", "Mixed"]
const tenures = ["Freehold", "Leasehold"]
const sizeUnits = ["acres", "hectares", "square feet", "square metres"]
const statuses = [
  "Active",
  "For Sale",
  "Under Consideration",
  "Sold",
  "Inactive",
]
const complianceStatuses = ["Unknown", "Paid", "In Arrears", "Exempt"]

export function PropertyDialog({
  open,
  onOpenChange,
  property,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  property?: Property
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            {property ? "Edit property details" : "Add property"}
          </DialogTitle>
          <DialogDescription>
            {property
              ? "Update the property name, LR number, address, classification, size, and map information."
              : "Create a register record. Ownership, units, compliance and documents can be added afterward."}
          </DialogDescription>
        </DialogHeader>
        <PropertyForm
          property={property}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function PropertyForm({
  property,
  onDone,
}: {
  property?: Property
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const form = useForm<z.input<typeof propertySchema>, unknown, PropertyInput>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      alias: property?.alias ?? "",
      title_number: property?.title_number ?? "",
      title_deed_name: property?.title_deed_name ?? "",
      property_type: property?.property_type ?? "Residential",
      county: property?.county ?? "",
      location: property?.location ?? "",
      size: property?.size ?? undefined,
      size_unit: property?.size_unit ?? "acres",
      tenure: property?.tenure ?? "Freehold",
      status: property?.status ?? "Active",
      land_rent_status: property?.land_rent_status ?? "Unknown",
      rates_status: property?.rates_status ?? "Unknown",
      latitude: property?.latitude ?? undefined,
      longitude: property?.longitude ?? undefined,
      google_maps_url: property?.google_maps_url ?? "",
      lease_expiry: property?.lease_expiry ?? "",
      deposit_target_months: property?.deposit_target_months ?? 2,
      notes: property?.notes ?? "",
    },
  })

  const mutation = useMutation({
    mutationFn: (values: PropertyInput) =>
      property
        ? updateProperty(property.property_id, values)
        : createProperty(values),
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success(
        `${values.alias} has been ${property ? "updated" : "added"}`
      )
      onDone()
    },
    onError: (error) =>
      toast.error(
        getErrorMessage(
          error,
          property ? "Couldn't update this property." : "Couldn't add it."
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
        className="grid max-h-[70vh] gap-4 overflow-x-hidden overflow-y-auto px-6 py-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Property name"
            htmlFor="property-alias"
            error={form.formState.errors.alias?.message}
          >
            <Input
              id="property-alias"
              placeholder="Balmoral Court"
              className={inputClass}
              autoFocus
              {...form.register("alias")}
            />
          </Field>
          <Field label="LR / Title number" htmlFor="property-title">
            <Input
              id="property-title"
              placeholder="LR No. 209/5445"
              className={inputClass}
              {...form.register("title_number")}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Title deed registered name"
            htmlFor="property-deed"
          >
            <Input
              id="property-deed"
              placeholder="Name shown on the title deed"
              className={inputClass}
              {...form.register("title_deed_name")}
            />
          </Field>
          <div className="grid gap-2">
            <FieldLabel htmlFor="property-type" className={labelClass}>
              Property use
            </FieldLabel>
            <select
              id="property-type"
              className={inputClass}
              {...form.register("property_type")}
            >
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="County" htmlFor="property-county">
            <Input
              id="property-county"
              placeholder="Nairobi"
              className={inputClass}
              {...form.register("county")}
            />
          </Field>
          <Field label="Location" htmlFor="property-location">
            <Input
              id="property-location"
              placeholder="Nairobi, Nairobi"
              className={inputClass}
              {...form.register("location")}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="property-tenure" className={labelClass}>
              Tenure
            </FieldLabel>
            <select
              id="property-tenure"
              className={inputClass}
              {...form.register("tenure")}
            >
              {tenures.map((tenure) => (
                <option key={tenure} value={tenure}>
                  {tenure}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="property-status" className={labelClass}>
              Status
            </FieldLabel>
            <select
              id="property-status"
              className={inputClass}
              {...form.register("status")}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Occupied properties are shown as Let.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Size" htmlFor="property-size">
            <Input
              id="property-size"
              type="number"
              step="0.001"
              min="0"
              placeholder="2.701"
              className={inputClass}
              {...form.register("size")}
            />
          </Field>
          <div className="grid gap-2">
            <FieldLabel htmlFor="property-size-unit" className={labelClass}>
              Size unit
            </FieldLabel>
            <select
              id="property-size-unit"
              className={inputClass}
              {...form.register("size_unit")}
            >
              {sizeUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Latitude" htmlFor="property-latitude">
            <Input
              id="property-latitude"
              type="number"
              step="any"
              placeholder="-1.286389"
              className={inputClass}
              {...form.register("latitude")}
            />
          </Field>
          <Field label="Longitude" htmlFor="property-longitude">
            <Input
              id="property-longitude"
              type="number"
              step="any"
              placeholder="36.817223"
              className={inputClass}
              {...form.register("longitude")}
            />
          </Field>
        </div>

        <Field label="Google Maps URL" htmlFor="property-maps">
          <Input
            id="property-maps"
            placeholder="https://maps.google.com/…"
            className={inputClass}
            {...form.register("google_maps_url")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel className={labelClass}>Lease expiry</FieldLabel>
            <Controller
              control={form.control}
              name="lease_expiry"
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
          <div className="grid gap-2">
            <FieldLabel
              htmlFor="property-deposit-months"
              className={labelClass}
            >
              Deposit target (months)
            </FieldLabel>
            <Input
              id="property-deposit-months"
              type="number"
              min="1"
              max="12"
              className={inputClass}
              {...form.register("deposit_target_months")}
            />
            <FieldError>
              {form.formState.errors.deposit_target_months?.message}
            </FieldError>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="property-land-rent" className={labelClass}>
              Land rent status
            </FieldLabel>
            <select
              id="property-land-rent"
              className={inputClass}
              {...form.register("land_rent_status")}
            >
              {complianceStatuses.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="property-rates" className={labelClass}>
              County rates status
            </FieldLabel>
            <select
              id="property-rates"
              className={inputClass}
              {...form.register("rates_status")}
            >
              {complianceStatuses.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-2">
          <FieldLabel htmlFor="property-notes" className={labelClass}>
            Internal notes
          </FieldLabel>
          <Textarea
            id="property-notes"
            rows={3}
            placeholder="Anything worth remembering about this property."
            {...form.register("notes")}
          />
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
          {property ? "Save property" : "Add property"}
        </Button>
      </DialogFooter>
    </form>
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
