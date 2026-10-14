"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon } from "lucide-react"
import toast from "react-hot-toast"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getErrorMessage } from "@/lib/api/errors"
import { createEmergencyContact, staffKeys } from "@/lib/api/staff"
import {
  emergencyContactSchema,
  type EmergencyContactValues,
} from "@/lib/schemas/emergency-contact"
import { contactRelationships } from "@/lib/staff"
import type { StaffMember } from "@/lib/types"
import { cn } from "@/lib/utils"

type AddEmergencyContactDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: StaffMember
  // The first contact a staff member gets starts out as their primary one
  isFirst: boolean
}

const inputClass = "h-12 rounded-xl px-3.5"

export function AddEmergencyContactDialog({
  open,
  onOpenChange,
  staff,
  isFirst,
}: AddEmergencyContactDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 rounded-2xl p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Add Emergency Contact
          </DialogTitle>
          <DialogDescription>
            Who should we call if something happens to {staff.full_name}?
          </DialogDescription>
        </DialogHeader>
        {/* Radix unmounts the content when closed, so the form starts fresh each time */}
        <EmergencyContactForm
          staffId={staff.staff_id}
          isFirst={isFirst}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function EmergencyContactForm({
  staffId,
  isFirst,
  onDone,
}: {
  staffId: string
  isFirst: boolean
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const form = useForm<EmergencyContactValues>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: {
      full_name: "",
      relationship: "",
      phone: "",
      national_id: "",
      is_primary: isFirst,
    },
  })

  const mutation = useMutation({
    mutationFn: (values: EmergencyContactValues) =>
      createEmergencyContact(staffId, values),
    onSuccess: (_contact, values) => {
      void queryClient.invalidateQueries({
        queryKey: staffKeys.emergencyContacts(staffId),
      })
      toast.success(`${values.full_name} has been added as a contact`)
      onDone()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Couldn't add this contact."))
    },
  })

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      className="space-y-5 px-6 py-5"
      noValidate
    >
      <Controller
        name="full_name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="gap-2">
            <FieldLabel htmlFor="contact-name">
              Full Name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              {...field}
              id="contact-name"
              placeholder="Jane Wanjiku"
              autoComplete="off"
              autoFocus
              aria-invalid={fieldState.invalid}
              className={inputClass}
            />
            <FieldError errors={[fieldState.error]} className="text-xs" />
          </Field>
        )}
      />

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
        <Controller
          name="relationship"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-2">
              <FieldLabel htmlFor="contact-relationship">
                Relationship <span className="text-destructive">*</span>
              </FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="contact-relationship"
                  aria-invalid={fieldState.invalid}
                  className={cn("w-full data-[size=default]:h-12", inputClass)}
                >
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {contactRelationships.map((relationship) => (
                    <SelectItem key={relationship} value={relationship}>
                      {relationship}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} className="text-xs" />
            </Field>
          )}
        />
        <Controller
          name="phone"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-2">
              <FieldLabel htmlFor="contact-phone">
                Phone <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                {...field}
                id="contact-phone"
                type="tel"
                placeholder="07 xx xxx xxx"
                aria-invalid={fieldState.invalid}
                className={inputClass}
              />
              <FieldError errors={[fieldState.error]} className="text-xs" />
            </Field>
          )}
        />
      </div>

      <Controller
        name="national_id"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="gap-2">
            <FieldLabel htmlFor="contact-id">National ID No.</FieldLabel>
            <Input
              {...field}
              id="contact-id"
              inputMode="numeric"
              placeholder="12345678"
              autoComplete="off"
              aria-invalid={fieldState.invalid}
              className={inputClass}
            />
            <FieldError errors={[fieldState.error]} className="text-xs" />
          </Field>
        )}
      />

      <Controller
        name="is_primary"
        control={form.control}
        render={({ field }) => (
          <Field orientation="horizontal" className="items-start gap-3">
            <Checkbox
              id="contact-primary"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <FieldLabel htmlFor="contact-primary">Primary contact</FieldLabel>
              <FieldDescription className="text-xs">
                The first person to call in an emergency.
              </FieldDescription>
            </div>
          </Field>
        )}
      />

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
          {mutation.isPending ? "Saving…" : "Save Contact"}
        </Button>
      </div>
    </form>
  )
}
