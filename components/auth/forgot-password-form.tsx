"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeftIcon, Loader2Icon, MailCheckIcon } from "lucide-react"
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
import { requestPasswordReset } from "@/lib/api/auth"
import { getErrorMessage } from "@/lib/api/errors"
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/schemas/auth"

export function ForgotPasswordForm() {
  // Holds the address the reset link was sent to, once submitted
  const [sentTo, setSentTo] = useState<string | null>(null)
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  async function onSubmit({ email }: ForgotPasswordValues) {
    try {
      await requestPasswordReset(email)
      setSentTo(email)
    } catch (error) {
      form.setError("root", {
        message: getErrorMessage(error, "Couldn't send the email. Try again."),
      })
    }
  }

  const submitting = form.formState.isSubmitting
  const rootError = form.formState.errors.root

  return (
    <div className="w-full max-w-md">
      <Card className="gap-6 rounded-2xl py-8 shadow-xl shadow-foreground/5">
        {sentTo ? (
          <CardHeader className="justify-items-center px-6 text-center sm:px-8">
            <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
              <MailCheckIcon className="size-6" />
            </div>
            <CardTitle className="text-2xl font-semibold">
              <h1>Check your email</h1>
            </CardTitle>
            <CardDescription>
              We sent password reset instructions to{" "}
              <span className="font-medium text-foreground">{sentTo}</span>.
            </CardDescription>
          </CardHeader>
        ) : (
          <>
            <CardHeader className="px-6 text-center sm:px-8">
              <CardTitle className="text-2xl font-semibold">
                <h1>Forgot your password?</h1>
              </CardTitle>
              <CardDescription>
                Enter the email you use for MNC People and we&apos;ll send you
                instructions to reset your password.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 sm:px-8">
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                noValidate
                className="flex flex-col gap-5"
              >
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="gap-2">
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        placeholder="you@mangacapital.com"
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

                <FieldError errors={[rootError]} />

                <Button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 h-12 rounded-xl"
                >
                  {submitting && <Loader2Icon className="animate-spin" />}
                  {submitting ? "Sending…" : "Send reset instructions"}
                </Button>
              </form>
            </CardContent>
          </>
        )}

        <div className="px-6 text-center sm:px-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            <ArrowLeftIcon className="size-4" />
            Back to log in
          </Link>
        </div>
      </Card>
    </div>
  )
}
