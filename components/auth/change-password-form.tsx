"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { changePassword } from "@/lib/api/auth"
import { getErrorMessage } from "@/lib/api/errors"
import {
  changePasswordSchema,
  PASSWORD_MIN,
  type ChangePasswordValues,
} from "@/lib/schemas/auth"
import { useAuth } from "@/providers/auth-provider"

const fields = [
  {
    name: "currentPassword",
    label: "Temporary password",
    autoComplete: "current-password",
    placeholder: "Enter the password you were given",
  },
  {
    name: "password",
    label: "New password",
    autoComplete: "new-password",
    placeholder: "Enter a new password",
  },
  {
    name: "confirmPassword",
    label: "Confirm password",
    autoComplete: "new-password",
    placeholder: "Re-enter the new password",
  },
] as const

export function ChangePasswordForm() {
  const { user, refreshUser, logout } = useAuth()
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  })

  // Reloading the profile clears `must_change_password`, and the auth
  // provider then sends the user on to the dashboard
  async function onSubmit(values: ChangePasswordValues) {
    try {
      await changePassword(values.currentPassword, values.password)
      await refreshUser()
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

  return (
    <div className="w-full max-w-md">
      <Card className="gap-6 rounded-2xl py-8 shadow-xl shadow-foreground/5">
        <CardHeader className="px-6 text-center sm:px-8">
          <CardTitle className="text-2xl font-semibold">
            <h1>Set your password</h1>
          </CardTitle>
          <CardDescription>
            {user?.full_name ? `Welcome, ${user.full_name}. ` : ""}
            Replace your temporary password with one of at least {
              PASSWORD_MIN
            }{" "}
            characters.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 sm:px-8">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-5"
          >
            {fields.map((item, index) => (
              <Controller
                key={item.name}
                name={item.name}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLabel htmlFor={item.name}>{item.label}</FieldLabel>
                    <Input
                      {...field}
                      id={item.name}
                      type="password"
                      autoComplete={item.autoComplete}
                      autoFocus={index === 0}
                      placeholder={item.placeholder}
                      aria-invalid={fieldState.invalid}
                      className="h-12 rounded-xl px-3.5"
                    />
                    <FieldError
                      errors={[fieldState.error]}
                      className="text-xs"
                    />
                  </Field>
                )}
              />
            ))}

            <FieldError errors={[rootError]} />

            <Button
              type="submit"
              disabled={submitting}
              className="mt-1 h-12 rounded-xl"
            >
              {submitting && <Loader2Icon className="animate-spin" />}
              {submitting ? "Saving…" : "Save password"}
            </Button>
          </form>
        </CardContent>

        <div className="px-6 text-center sm:px-8">
          <button
            type="button"
            onClick={() => void logout()}
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            Log out instead
          </button>
        </div>
      </Card>
    </div>
  )
}
