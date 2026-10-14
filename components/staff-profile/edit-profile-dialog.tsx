"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  FileTextIcon,
  HeartIcon,
  Loader2Icon,
  MapPinIcon,
  UserIcon,
  type LucideIcon,
} from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"
import {
  Controller,
  useForm,
  type Control,
  type FieldErrors,
  type FieldPath,
} from "react-hook-form"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useLocations } from "@/hooks/use-locations"
import { getErrorMessage } from "@/lib/api/errors"
import { locationsKey } from "@/lib/api/locations"
import { staffKeys, updateStaffProfile } from "@/lib/api/staff"
import {
  staffProfileSchema,
  type StaffProfileValues,
} from "@/lib/schemas/staff"
import { staffRoles } from "@/lib/staff"
import type { StaffMember } from "@/lib/types"
import { cn } from "@/lib/utils"

type EditProfileDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: StaffMember
}

type FieldName = FieldPath<StaffProfileValues>

const inputClass = "h-12 rounded-xl px-3.5"

// Each tab lists its fields so a failed save can jump to the first error
const tabs = [
  {
    value: "details",
    label: "Details",
    icon: UserIcon,
    fields: [
      "full_name",
      "date_of_birth",
      "role",
      "email",
      "work_location_id",
      "phone",
      "start_date",
      "notes",
    ],
  },
  {
    value: "identity",
    label: "Identity",
    icon: FileTextIcon,
    fields: [
      "national_id",
      "passport",
      "drivers_licence",
      "nssf_number",
      "sha_number",
      "kra_pin",
      "sacco",
    ],
  },
  {
    value: "cover",
    label: "Life Cover",
    icon: HeartIcon,
    fields: [
      "life_cover_provider",
      "policy_number",
      "beneficiary",
      "beneficiary_id",
      "life_benefit",
      "critical_illness_benefit",
      "disability_benefit",
      "funeral_benefit",
      "life_premium",
    ],
  },
] satisfies {
  value: string
  label: string
  icon: LucideIcon
  fields: FieldName[]
}[]

const identityFields: {
  name: FieldName
  label: string
  placeholder: string
}[] = [
  { name: "national_id", label: "National ID No.", placeholder: "12345678" },
  { name: "passport", label: "Passport No.", placeholder: "AK1234567" },
  {
    name: "drivers_licence",
    label: "Driver's License",
    placeholder: "DL-1234567",
  },
  { name: "nssf_number", label: "NSSF No.", placeholder: "123456789" },
  { name: "sha_number", label: "SHA No.", placeholder: "CR1234567890123-4" },
  { name: "kra_pin", label: "KRA PIN No.", placeholder: "A012345678Z" },
  { name: "sacco", label: "SACCO", placeholder: "Stima Sacco" },
]

const amountFields: { name: FieldName; label: string }[] = [
  { name: "life_benefit", label: "Life Benefit" },
  { name: "critical_illness_benefit", label: "Critical Illness" },
  { name: "disability_benefit", label: "Permanent & Total Disability" },
  { name: "funeral_benefit", label: "Funeral Benefit" },
  { name: "life_premium", label: "Annual Premium" },
]

export function EditProfileDialog({
  open,
  onOpenChange,
  staff,
}: EditProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Header and footer stay put while the tab body scrolls */}
      <DialogContent
        showCloseButton={false}
        className="flex flex-col gap-0 overflow-hidden rounded-2xl p-0"
      >
        <DialogHeader className="gap-1 px-6 pt-5 pb-4">
          <DialogTitle className="text-lg font-semibold">
            Edit Profile
          </DialogTitle>
          <DialogDescription>
            Updating {staff.full_name.split(" ")[0]}&apos;s record
          </DialogDescription>
        </DialogHeader>
        {/* Radix unmounts the content when closed, so the form starts fresh each time */}
        <EditProfileForm staff={staff} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function EditProfileForm({
  staff,
  onDone,
}: {
  staff: StaffMember
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const locations = useLocations().data ?? []
  const [tab, setTab] = useState("details")

  const form = useForm<StaffProfileValues>({
    resolver: zodResolver(staffProfileSchema),
    defaultValues: {
      full_name: staff.full_name,
      role: staff.role,
      work_location_id: staff.work_location_id ?? "",
      email: staff.email ?? "",
      phone: staff.phone ?? "",
      date_of_birth: staff.date_of_birth ?? "",
      start_date: staff.start_date ?? "",
      notes: staff.notes ?? "",
      national_id: staff.national_id ?? "",
      passport: staff.passport ?? "",
      drivers_licence: staff.drivers_licence ?? "",
      nssf_number: staff.nssf_number ?? "",
      sha_number: staff.sha_number ?? "",
      kra_pin: staff.kra_pin ?? "",
      sacco: staff.sacco ?? "",
      life_cover_provider: staff.life_cover_provider ?? "",
      policy_number: staff.policy_number ?? "",
      beneficiary: staff.beneficiary ?? "",
      beneficiary_id: staff.beneficiary_id ?? "",
      life_benefit: staff.life_benefit?.toString() ?? "",
      critical_illness_benefit:
        staff.critical_illness_benefit?.toString() ?? "",
      disability_benefit: staff.disability_benefit?.toString() ?? "",
      funeral_benefit: staff.funeral_benefit?.toString() ?? "",
      life_premium: staff.life_premium?.toString() ?? "",
    },
  })
  const errors = form.formState.errors

  // A role from before the current list still shows as an option
  const roles = staffRoles.includes(staff.role)
    ? staffRoles
    : [staff.role, ...staffRoles]

  // Locations show a staff count, so they're refreshed along with the staff
  const mutation = useMutation({
    mutationFn: (values: StaffProfileValues) => {
      const location = locations.find(
        (l) => l.location_id === values.work_location_id
      )
      return updateStaffProfile(staff, values, location?.name ?? "")
    },
    onSuccess: (_member, values) => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.all })
      void queryClient.invalidateQueries({ queryKey: locationsKey })
      toast.success(`${values.full_name}'s profile has been updated`)
      onDone()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Couldn't update this profile."))
    },
  })

  // Errors can sit on a hidden tab, so open the first tab that has one
  function showFirstError(fieldErrors: FieldErrors<StaffProfileValues>) {
    const first = tabs.find((t) => t.fields.some((f) => f in fieldErrors))
    if (first) setTab(first.value)
  }

  return (
    <form
      onSubmit={form.handleSubmit(
        (values) => mutation.mutate(values),
        showFirstError
      )}
      className="flex min-h-0 flex-1 flex-col"
      noValidate
    >
      <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1 gap-0">
        <div className="border-b px-4 pb-[3px]">
          <TabsList variant="line" className="w-full">
            {tabs.map(({ value, label, icon: Icon, fields }) => (
              <TabsTrigger key={value} value={value}>
                <Icon />
                {label}
                {fields.some((f) => f in errors) && (
                  <span
                    aria-label="Has errors"
                    className="size-1.5 rounded-full bg-destructive"
                  />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <TabsContent value="details" className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
              <TextField
                control={form.control}
                name="full_name"
                label="Full Name"
                required
              />
              <DateField
                control={form.control}
                name="date_of_birth"
                label="Date of Birth"
                placeholder="Pick a date of birth"
                startMonth={new Date(1940, 0)}
                endMonth={new Date()}
              />
            </div>

            <SelectField
              control={form.control}
              name="role"
              label="Role"
              placeholder="Select a role..."
              options={roles.map((role) => ({ value: role, label: role }))}
            />

            <TextField
              control={form.control}
              name="email"
              type="email"
              placeholder="staff@example.com"
              label={
                <>
                  Email Address
                  <Badge variant="secondary" className="font-normal">
                    Used for leave notifications
                  </Badge>
                </>
              }
            />

            <SelectField
              control={form.control}
              name="work_location_id"
              placeholder="Select location..."
              label={
                <>
                  <MapPinIcon className="size-4 text-muted-foreground" />
                  Location of Work
                </>
              }
              options={locations.map((l) => ({
                value: l.location_id,
                label: l.name,
              }))}
            />

            <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
              <TextField
                control={form.control}
                name="phone"
                type="tel"
                label="Phone"
                placeholder="07 xx xxx xxx"
              />
              <DateField
                control={form.control}
                name="start_date"
                label="Start Date"
                placeholder="Pick a start date"
                startMonth={new Date(1990, 0)}
                required
              />
            </div>

            <Controller
              name="notes"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2">
                  <FieldLabel htmlFor="profile-notes">Notes</FieldLabel>
                  <Textarea
                    {...field}
                    id="profile-notes"
                    rows={3}
                    placeholder="Anything else worth keeping on record"
                    aria-invalid={fieldState.invalid}
                    className="rounded-xl px-3.5 py-3"
                  />
                  <FieldError errors={[fieldState.error]} className="text-xs" />
                </Field>
              )}
            />
          </TabsContent>

          <TabsContent value="identity" className="space-y-5">
            {identityFields.map((item) => (
              <TextField key={item.name} control={form.control} {...item} />
            ))}
          </TabsContent>

          <TabsContent value="cover" className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Enter cover amounts in KES. Leave blank if not applicable.
            </p>
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
              <TextField
                control={form.control}
                name="life_cover_provider"
                label="Provider"
                placeholder="ICEA Lion Life Insurance"
              />
              <TextField
                control={form.control}
                name="policy_number"
                label="Policy No."
                placeholder="025/GLS/0013035"
              />
            </div>

            <p className="flex items-center gap-3 pt-1 text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase after:h-px after:flex-1 after:bg-border">
              Beneficiary
            </p>
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
              <TextField
                control={form.control}
                name="beneficiary"
                label="Name"
                placeholder="Full name"
              />
              <TextField
                control={form.control}
                name="beneficiary_id"
                label="ID No."
                placeholder="12345678"
              />
            </div>

            <p className="flex items-center gap-3 pt-1 text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase after:h-px after:flex-1 after:bg-border">
              Benefits (KES)
            </p>
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
              {amountFields.map((item) => (
                <TextField
                  key={item.name}
                  control={form.control}
                  inputMode="decimal"
                  placeholder="0"
                  {...item}
                />
              ))}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <div className="flex justify-end gap-2 border-t px-6 py-4">
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
          {mutation.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}

type BaseFieldProps = {
  control: Control<StaffProfileValues>
  name: FieldName
  label: React.ReactNode
  placeholder?: string
  required?: boolean
}

function Label({ name, label, required }: BaseFieldProps) {
  return (
    <FieldLabel htmlFor={`profile-${name}`}>
      {label}
      {required && <span className="text-destructive">*</span>}
    </FieldLabel>
  )
}

function TextField({
  type,
  inputMode,
  ...props
}: BaseFieldProps & Pick<React.ComponentProps<"input">, "type" | "inputMode">) {
  return (
    <Controller
      name={props.name}
      control={props.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className="gap-2">
          <Label {...props} />
          <Input
            {...field}
            id={`profile-${props.name}`}
            type={type}
            inputMode={inputMode}
            placeholder={props.placeholder}
            autoComplete="off"
            aria-invalid={fieldState.invalid}
            className={inputClass}
          />
          <FieldError errors={[fieldState.error]} className="text-xs" />
        </Field>
      )}
    />
  )
}

function SelectField({
  options,
  ...props
}: BaseFieldProps & { options: { value: string; label: string }[] }) {
  return (
    <Controller
      name={props.name}
      control={props.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className="gap-2">
          <Label {...props} required />
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger
              id={`profile-${props.name}`}
              aria-invalid={fieldState.invalid}
              className={cn("w-full data-[size=default]:h-12", inputClass)}
            >
              <SelectValue placeholder={props.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={[fieldState.error]} className="text-xs" />
        </Field>
      )}
    />
  )
}

function DateField({
  startMonth,
  endMonth,
  ...props
}: BaseFieldProps & { startMonth?: Date; endMonth?: Date }) {
  return (
    <Controller
      name={props.name}
      control={props.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className="gap-2">
          <Label {...props} />
          <DatePicker
            id={`profile-${props.name}`}
            value={field.value}
            onChange={field.onChange}
            placeholder={props.placeholder}
            invalid={fieldState.invalid}
            startMonth={startMonth}
            endMonth={endMonth}
            className={inputClass}
          />
          <FieldError errors={[fieldState.error]} className="text-xs" />
        </Field>
      )}
    />
  )
}
