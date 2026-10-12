"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  LOCATION_NAME_MAX,
  locationSchema,
  type LocationValues,
} from "@/lib/schemas/location"
import type { Location } from "@/lib/types"

type LocationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  // When set the dialog renames this location, otherwise it adds a new one
  location?: Location
  takenNames: string[]
  onSave: (name: string) => void
}

export function LocationDialog({
  open,
  onOpenChange,
  location,
  ...formProps
}: LocationDialogProps) {
  const editing = Boolean(location)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 rounded-2xl p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            {editing ? "Edit Location" : "Add Location"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Rename this location everywhere it's used."
              : "Create a place staff can be assigned to."}
          </DialogDescription>
        </DialogHeader>
        {/* Radix unmounts the content when closed, so the form starts fresh each time */}
        <LocationForm location={location} {...formProps} />
      </DialogContent>
    </Dialog>
  )
}

function LocationForm({
  location,
  takenNames,
  onSave,
}: Pick<LocationDialogProps, "location" | "takenNames" | "onSave">) {
  const form = useForm<LocationValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: { name: location?.name ?? "" },
  })

  // Names are compared case-insensitively so records stay consistent
  function onSubmit({ name }: LocationValues) {
    const taken = takenNames.some(
      (taken) => taken.toLowerCase() === name.toLowerCase()
    )
    if (taken) {
      form.setError("name", { message: "A location with this name exists" })
      return
    }
    onSave(name)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="gap-2">
            <FieldLabel htmlFor="location-name">
              Location name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              {...field}
              id="location-name"
              autoFocus
              autoComplete="off"
              maxLength={LOCATION_NAME_MAX}
              aria-invalid={fieldState.invalid}
              className="h-12 rounded-xl px-3.5"
            />
            <div className="flex items-start justify-between gap-4">
              <FieldError errors={[fieldState.error]} className="text-xs" />
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                {field.value.length}/{LOCATION_NAME_MAX}
              </span>
            </div>
          </Field>
        )}
      />

      <div className="mt-6 flex justify-end gap-2">
        <DialogClose asChild>
          <Button type="button" variant="ghost" className="h-11 px-5">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" className="h-11 rounded-xl px-6">
          {location ? "Save changes" : "Add location"}
        </Button>
      </div>
    </form>
  )
}
