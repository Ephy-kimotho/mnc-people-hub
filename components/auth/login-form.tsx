"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import Link from "next/link"
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
import { getErrorMessage } from "@/lib/api/errors"
import { loginSchema, type LoginValues } from "@/lib/schemas/auth"
import { useAuth } from "@/providers/auth-provider"

export function LoginForm() {
  const { login } = useAuth()
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  })

  // On success the auth provider redirects to the user's landing page
  async function onSubmit(values: LoginValues) {
    try {
      await login(values)
    } catch (error) {
      form.setError("root", {
        message: getErrorMessage(error, "Couldn't log you in. Try again."),
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
            <h1>Welcome back</h1>
          </CardTitle>
          <CardDescription>Log in to manage staff leave.</CardDescription>
        </CardHeader>

        <CardContent className="px-6 sm:px-8">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-5"
          >
            <Controller
              name="username"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2">
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <Input
                    {...field}
                    id="username"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoFocus
                    placeholder="Enter your username"
                    aria-invalid={fieldState.invalid}
                    className="h-12 rounded-xl px-3.5"
                  />
                  <FieldError errors={[fieldState.error]} className="text-xs" />
                </Field>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2">
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    {...field}
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={fieldState.invalid}
                    className="h-12 rounded-xl px-3.5"
                    placeholder="Enter your password"
                  />
                  <FieldError errors={[fieldState.error]} className="text-xs" />
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
              {submitting ? "Logging in…" : "Log in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
