"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CircleCheckIcon, Loader2Icon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
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
import {
  PASSWORD_MIN,
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/schemas/auth"
import { delay } from "@/lib/utils"

export function ResetPasswordForm() {
  const [done, setDone] = useState(false)
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  // Simulates saving the new password
  async function onSubmit() {
    await delay(1500)
    setDone(true)
  }

  const submitting = form.formState.isSubmitting

  if (done) {
    return (
      <div className="w-full max-w-md">
        <Card className="gap-6 rounded-2xl py-8 shadow-xl shadow-foreground/5">
          <CardHeader className="justify-items-center px-6 text-center sm:px-8">
            <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
              <CircleCheckIcon className="size-6" />
            </div>
            <CardTitle className="text-2xl font-semibold">
              <h1>Password updated</h1>
            </CardTitle>
            <CardDescription>
              You can now log in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 sm:px-8">
            <Button asChild className="h-12 w-full rounded-xl">
              <Link href="/login">Back to log in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <Card className="gap-6 rounded-2xl py-8 shadow-xl shadow-foreground/5">
        <CardHeader className="px-6 text-center sm:px-8">
          <CardTitle className="text-2xl font-semibold">
            <h1>Set a new password</h1>
          </CardTitle>
          <CardDescription>
            Choose a password with at least {PASSWORD_MIN} characters.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 sm:px-8">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-5"
          >
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2">
                  <FieldLabel htmlFor="password">New password</FieldLabel>
                  <Input
                    {...field}
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    autoFocus
                    placeholder="Enter a new password"
                    aria-invalid={fieldState.invalid}
                    className="h-12 rounded-xl px-3.5"
                  />
                  <FieldError errors={[fieldState.error]} className="text-xs" />
                </Field>
              )}
            />

            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2">
                  <FieldLabel htmlFor="confirm-password">
                    Confirm password
                  </FieldLabel>
                  <Input
                    {...field}
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter the new password"
                    aria-invalid={fieldState.invalid}
                    className="h-12 rounded-xl px-3.5"
                  />
                  <FieldError errors={[fieldState.error]} className="text-xs" />
                </Field>
              )}
            />

            <Button
              type="submit"
              disabled={submitting}
              className="mt-1 h-12 rounded-xl"
            >
              {submitting && <Loader2Icon className="animate-spin" />}
              {submitting ? "Saving…" : "Reset password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
