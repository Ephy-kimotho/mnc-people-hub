"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon } from "lucide-react"
import toast from "react-hot-toast"
import { useForm } from "react-hook-form"

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
import { createUnit, propertyKeys, updateUnit } from "@/lib/api/properties"
import { unitSchema, type UnitInput } from "@/lib/schemas/property"
import type { PropertyUnit } from "@/lib/types"

const inputClass = "h-11 rounded-xl px-3.5"
const labelClass =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"
const unitStatuses = ["Vacant", "Occupied", "UnderMaintenance"]

export function UnitDialog({
  open,
  onOpenChange,
  propertyId,
  unit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyId: string
  unit?: PropertyUnit
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-x-hidden p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            {unit ? "Edit unit" : "Add unit"}
          </DialogTitle>
          <DialogDescription>
            {unit
              ? "Update the unit's details and status."
              : "Create a rentable unit on this property."}
          </DialogDescription>
        </DialogHeader>
        <UnitForm
          propertyId={propertyId}
          unit={unit}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function UnitForm({
  propertyId,
  unit,
  onDone,
}: {
  propertyId: string
  unit?: PropertyUnit
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const form = useForm<z.input<typeof unitSchema>, unknown, UnitInput>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      label: unit?.label ?? "",
      bedrooms: unit?.bedrooms ?? undefined,
      status: (unit?.status as UnitInput["status"]) ?? "Vacant",
      default_rent_kes: unit?.default_rent_kes ?? undefined,
      default_rent_usd: unit?.default_rent_usd ?? undefined,
      notes: unit?.notes ?? "",
    },
  })

  const mutation = useMutation({
    mutationFn: (values: UnitInput) =>
      unit
        ? updateUnit(unit.unit_id, values)
        : createUnit(propertyId, values),
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success(`${values.label} has been ${unit ? "updated" : "added"}`)
      onDone()
    },
    onError: (error) =>
      toast.error(
        getErrorMessage(
          error,
          unit ? "Couldn't update this unit." : "Couldn't add it."
        )
      ),
  })

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      noValidate
    >
      <fieldset disabled={mutation.isPending} className="grid gap-4 px-6 py-5">
        <div className="grid gap-2">
          <FieldLabel htmlFor="unit-label" className={labelClass}>
            Unit name
          </FieldLabel>
          <Input
            id="unit-label"
            placeholder="Garden House"
            className={inputClass}
            {...form.register("label")}
          />
          <FieldError>{form.formState.errors.label?.message}</FieldError>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="unit-bedrooms" className={labelClass}>
              Bedrooms
            </FieldLabel>
            <Input
              id="unit-bedrooms"
              type="number"
              min="0"
              className={inputClass}
              {...form.register("bedrooms")}
            />
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="unit-status" className={labelClass}>
              Status
            </FieldLabel>
            <select
              id="unit-status"
              className={inputClass}
              {...form.register("status")}
            >
              {unitStatuses.map((status) => (
                <option key={status} value={status}>
                  {status === "UnderMaintenance" ? "Under maintenance" : status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="unit-rent-kes" className={labelClass}>
              Default rent (KES)
            </FieldLabel>
            <Input
              id="unit-rent-kes"
              type="number"
              min="0"
              className={inputClass}
              {...form.register("default_rent_kes")}
            />
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="unit-rent-usd" className={labelClass}>
              Default rent (USD)
            </FieldLabel>
            <Input
              id="unit-rent-usd"
              type="number"
              min="0"
              className={inputClass}
              {...form.register("default_rent_usd")}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <FieldLabel htmlFor="unit-notes" className={labelClass}>
            Notes
          </FieldLabel>
          <Textarea
            id="unit-notes"
            rows={3}
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
          {unit ? "Save changes" : "Add unit"}
        </Button>
      </DialogFooter>
    </form>
  )
}
