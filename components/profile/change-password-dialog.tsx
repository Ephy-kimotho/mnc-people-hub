"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CircleCheckIcon, Loader2Icon } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"

import { PasswordInput } from "@/components/password-input"
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
import { changePassword } from "@/lib/api/auth"
import { getErrorMessage } from "@/lib/api/errors"
import {
  changePasswordSchema,
  PASSWORD_MIN,
  type ChangePasswordValues,
} from "@/lib/schemas/auth"

const fields = [
  {
    name: "currentPassword",
    label: "Current password",
    autoComplete: "current-password",
    placeholder: "Enter your current password",
  },
  {
    name: "password",
    label: "New password",
    autoComplete: "new-password",
    placeholder: `At least ${PASSWORD_MIN} characters`,
  },
  {
    name: "confirmPassword",
    label: "Confirm new password",
    autoComplete: "new-password",
    placeholder: "Re-enter the new password",
  },
] as const

type ChangePasswordDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 rounded-2xl p-0">
        {/* Radix unmounts the content when closed, so the form starts fresh each time */}
        <ChangePasswordForm />
      </DialogContent>
    </Dialog>
  )
}

function ChangePasswordForm() {
  const [done, setDone] = useState(false)
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  })

  // The confirm field is only checked locally; the API takes the other two
  async function onSubmit(values: ChangePasswordValues) {
    try {
      await changePassword(values.currentPassword, values.password)
      setDone(true)
    } catch (error) {
      form.setError("root", {
        message: getErrorMessage(
          error,
          "Couldn't change your password. Try again."
        ),
      })
    }
  }

  const submitting = form.formState.isSubmitting
  const rootError = form.formState.errors.root

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
          <CircleCheckIcon className="size-6" />
        </span>
        <DialogHeader className="items-center gap-1">
          <DialogTitle className="text-lg font-semibold">
            Password updated
          </DialogTitle>
          <DialogDescription>
            Use your new password the next time you log in.
          </DialogDescription>
        </DialogHeader>
        <DialogClose asChild>
          <Button className="h-11 rounded-xl px-6">Done</Button>
        </DialogClose>
      </div>
    )
  }

  return (
    <>
      <DialogHeader className="gap-1 border-b px-6 py-5">
        <DialogTitle className="text-lg font-semibold">
          Change password
        </DialogTitle>
        <DialogDescription>
          Enter your current password, then choose a new one.
        </DialogDescription>
      </DialogHeader>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-5 px-6 py-5"
      >
        {fields.map((item, index) => (
          <Controller
            key={item.name}
            name={item.name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-2">
                <FieldLabel htmlFor={item.name}>
                  {item.label} <span className="text-destructive">*</span>
                </FieldLabel>
                <PasswordInput
                  {...field}
                  id={item.name}
                  autoComplete={item.autoComplete}
                  autoFocus={index === 0}
                  placeholder={item.placeholder}
                  aria-invalid={fieldState.invalid}
                  className="h-12 rounded-xl px-3.5"
                />
                <FieldError errors={[fieldState.error]} className="text-xs" />
              </Field>
            )}
          />
        ))}

        <FieldError errors={[rootError]} />

        <div className="mt-1 flex justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost" className="h-11 px-5">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={submitting}
            className="h-11 rounded-xl px-6"
          >
            {submitting && <Loader2Icon className="animate-spin" />}
            {submitting ? "Saving…" : "Update password"}
          </Button>
        </div>
      </form>
    </>
  )
}
