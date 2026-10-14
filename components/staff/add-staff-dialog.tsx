"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon, MapPinIcon, ShieldIcon } from "lucide-react"
import toast from "react-hot-toast"
import { Controller, useForm } from "react-hook-form"

import { DatePicker } from "@/components/date-picker"
import { Badge } from "@/components/ui/badge"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getErrorMessage } from "@/lib/api/errors"
import { locationsKey } from "@/lib/api/locations"
import { createStaff, staffKeys } from "@/lib/api/staff"
import { ANNUAL_LEAVE_DAYS } from "@/lib/leave"
import { staffSchema, type StaffValues } from "@/lib/schemas/staff"
import { staffRoles } from "@/lib/staff"
import type { StaffLocation } from "@/lib/types"
import { cn } from "@/lib/utils"

type AddStaffDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  locations: StaffLocation[]
}

const inputClass = "h-12 rounded-xl px-3.5"

export function AddStaffDialog({
  open,
  onOpenChange,
  locations,
}: AddStaffDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 rounded-2xl p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Add Staff Member
          </DialogTitle>
          <DialogDescription>
            Enter the details of your household employee.
          </DialogDescription>
        </DialogHeader>
        {/* Radix unmounts the content when closed, so the form starts fresh each time */}
        <AddStaffForm
          locations={locations}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function AddStaffForm({
  locations,
  onDone,
}: Pick<AddStaffDialogProps, "locations"> & { onDone: () => void }) {
  const queryClient = useQueryClient()
  const form = useForm<StaffValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      full_name: "",
      role: "",
      work_location_id: "",
      email: "",
      phone: "",
      date_of_birth: "",
      start_date: "",
    },
  })

  // Locations show a staff count, so they're refreshed along with the staff
  const mutation = useMutation({
    mutationFn: (values: StaffValues) => {
      const location = locations.find(
        (l) => l.location_id === values.work_location_id
      )
      return createStaff(values, location?.name ?? "")
    },
    onSuccess: (_member, values) => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.all })
      void queryClient.invalidateQueries({ queryKey: locationsKey })
      toast.success(`${values.full_name} has been added`)
      onDone()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Couldn't add this staff member."))
    },
  })

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      className="space-y-5 px-6 py-5"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
        <Controller
          name="full_name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-2">
              <FieldLabel htmlFor="staff-name">
                Full Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                {...field}
                id="staff-name"
                placeholder="John Doe"
                autoComplete="off"
                aria-invalid={fieldState.invalid}
                className={inputClass}
              />
              <FieldError errors={[fieldState.error]} className="text-xs" />
            </Field>
          )}
        />
        <Controller
          name="date_of_birth"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-2">
              <FieldLabel htmlFor="staff-dob">Date of Birth</FieldLabel>
              <DatePicker
                id="staff-dob"
                value={field.value}
                onChange={field.onChange}
                placeholder="Pick a date of birth"
                invalid={fieldState.invalid}
                startMonth={new Date(1940, 0)}
                endMonth={new Date()}
                className={inputClass}
              />
              <FieldError errors={[fieldState.error]} className="text-xs" />
            </Field>
          )}
        />
      </div>

      <Controller
        name="role"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="gap-2">
            <FieldLabel htmlFor="staff-role">
              Role <span className="text-destructive">*</span>
            </FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="staff-role"
                aria-invalid={fieldState.invalid}
                className={cn("w-full data-[size=default]:h-12", inputClass)}
              >
                <SelectValue placeholder="Select a role..." />
              </SelectTrigger>
              <SelectContent>
                {staffRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} className="text-xs" />
          </Field>
        )}
      />

      <Controller
        name="work_location_id"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="gap-2">
            <FieldLabel htmlFor="staff-location">
              <MapPinIcon className="size-4 text-muted-foreground" />
              Location of Work <span className="text-destructive">*</span>
            </FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="staff-location"
                aria-invalid={fieldState.invalid}
                className={cn("w-full data-[size=default]:h-12", inputClass)}
              >
                <SelectValue placeholder="Select location..." />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem
                    key={location.location_id}
                    value={location.location_id}
                  >
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} className="text-xs" />
          </Field>
        )}
      />

      <Controller
        name="email"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="gap-2">
            <FieldLabel htmlFor="staff-email">
              Email Address
              <Badge variant="secondary" className="font-normal">
                Used for leave notifications
              </Badge>
            </FieldLabel>
            <Input
              {...field}
              id="staff-email"
              type="email"
              placeholder="staff@example.com"
              aria-invalid={fieldState.invalid}
              className={inputClass}
            />
            <FieldError errors={[fieldState.error]} className="text-xs" />
          </Field>
        )}
      />

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
        <Controller
          name="phone"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-2">
              <FieldLabel htmlFor="staff-phone">Phone</FieldLabel>
              <Input
                {...field}
                id="staff-phone"
                type="tel"
                placeholder="07 xx xxx xxx"
                aria-invalid={fieldState.invalid}
                className={inputClass}
              />
              <FieldError errors={[fieldState.error]} className="text-xs" />
            </Field>
          )}
        />
        <Controller
          name="start_date"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-2">
              <FieldLabel htmlFor="staff-start">
                Start Date <span className="text-destructive">*</span>
              </FieldLabel>
              <DatePicker
                id="staff-start"
                value={field.value}
                onChange={field.onChange}
                placeholder="Pick a start date"
                invalid={fieldState.invalid}
                startMonth={new Date(1990, 0)}
                className={inputClass}
              />
              <FieldError errors={[fieldState.error]} className="text-xs" />
            </Field>
          )}
        />
      </div>

      <div className="rounded-xl border bg-muted/60 p-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <ShieldIcon className="size-4 text-muted-foreground" />
          Statutory Notice
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          This employee will automatically be assigned {ANNUAL_LEAVE_DAYS} days
          of annual leave per the Kenya Employment Act.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-1">
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
          {mutation.isPending ? "Saving…" : "Save Employee"}
        </Button>
      </div>
    </form>
  )
}
