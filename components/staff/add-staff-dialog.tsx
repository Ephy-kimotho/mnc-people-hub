"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { MapPinIcon, ShieldIcon } from "lucide-react"
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
import { ANNUAL_LEAVE_DAYS } from "@/lib/leave"
import { staffSchema, type StaffValues } from "@/lib/schemas/staff"
import { staffRoles } from "@/lib/staff"
import type { StaffLocation } from "@/lib/types"
import { cn } from "@/lib/utils"

type AddStaffDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  locations: StaffLocation[]
  onSave: (values: StaffValues) => void
}

const inputClass = "h-12 rounded-xl px-3.5"

export function AddStaffDialog({
  open,
  onOpenChange,
  ...formProps
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
        <AddStaffForm {...formProps} />
      </DialogContent>
    </Dialog>
  )
}

function AddStaffForm({
  locations,
  onSave,
}: Pick<AddStaffDialogProps, "locations" | "onSave">) {
  const form = useForm<StaffValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      role: "",
      locationId: "",
      email: "",
      phone: "",
      startDate: "",
    },
  })

  return (
    <form
      onSubmit={form.handleSubmit(onSave)}
      className="space-y-5 px-6 py-5"
      noValidate
    >
      <Controller
        name="name"
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
        name="locationId"
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
          name="startDate"
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
          <Button type="button" variant="ghost" className="h-11 px-5">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" className="h-11 rounded-xl px-6">
          Save Employee
        </Button>
      </div>
    </form>
  )
}
