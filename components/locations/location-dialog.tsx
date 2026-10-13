"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon } from "lucide-react"
import toast from "react-hot-toast"
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
import { getErrorMessage } from "@/lib/api/errors"
import {
  createLocation,
  locationsKey,
  updateLocation,
} from "@/lib/api/locations"
import { staffKeys } from "@/lib/api/staff"
import {
  LOCATION_ADDRESS_MAX,
  LOCATION_NAME_MAX,
  locationSchema,
  type LocationValues,
} from "@/lib/schemas/location"
import type { StaffLocation } from "@/lib/types"

type LocationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  // When set the dialog edits this location, otherwise it adds a new one
  location?: StaffLocation
  takenNames: string[]
}

const inputClass = "h-12 rounded-xl px-3.5"

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
              ? "Update this location's name and address everywhere it's used."
              : "Create a place staff can be assigned to."}
          </DialogDescription>
        </DialogHeader>
        {/* Radix unmounts the content when closed, so the form starts fresh each time */}
        <LocationForm
          location={location}
          onDone={() => onOpenChange(false)}
          {...formProps}
        />
      </DialogContent>
    </Dialog>
  )
}

function LocationForm({
  location,
  takenNames,
  onDone,
}: Pick<LocationDialogProps, "location" | "takenNames"> & {
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const form = useForm<LocationValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: location?.name ?? "",
      address: location?.address ?? "",
    },
  })

  // Creates a location, or updates the one being edited. Staff rows show
  // the location by name, so a save refreshes them too.
  const mutation = useMutation({
    mutationFn: (values: LocationValues) =>
      location
        ? updateLocation(location.location_id, values)
        : createLocation(values),
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: locationsKey })
      void queryClient.invalidateQueries({ queryKey: staffKeys.all })
      toast.success(`${values.name} has been ${location ? "updated" : "added"}`)
      onDone()
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          location
            ? "Couldn't update this location."
            : "Couldn't add this location."
        )
      )
    },
  })

  // Names are compared case-insensitively so records stay consistent
  function onSubmit(values: LocationValues) {
    const taken = takenNames.some(
      (taken) => taken.toLowerCase() === values.name.toLowerCase()
    )
    if (taken) {
      form.setError("name", { message: "A location with this name exists" })
      return
    }
    mutation.mutate(values)
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-5 px-6 py-5"
    >
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
              placeholder="Enter location name"
              aria-invalid={fieldState.invalid}
              className={inputClass}
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

      <Controller
        name="address"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="gap-2">
            <FieldLabel htmlFor="location-address">Address</FieldLabel>
            <Input
              {...field}
              id="location-address"
              autoComplete="off"
              maxLength={LOCATION_ADDRESS_MAX}
              placeholder="e.g. Riverside Drive, Nairobi"
              aria-invalid={fieldState.invalid}
              className={inputClass}
            />
            <FieldError errors={[fieldState.error]} className="text-xs" />
          </Field>
        )}
      />

      <div className="mt-1 flex justify-end gap-2">
        <DialogClose asChild>
          <Button
            type="button"
            variant="ghost"
            disabled={mutation.isPending}
            className="h-11 px-5"
          >
            Cancel
          </Button>
        </DialogClose>
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="h-11 rounded-xl px-6"
        >
          {mutation.isPending && <Loader2Icon className="animate-spin" />}
          {mutation.isPending
            ? "Saving…"
            : location
              ? "Save changes"
              : "Add location"}
        </Button>
      </div>
    </form>
  )
}
