import { z } from "zod"

export const PASSWORD_MIN = 8

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export type LoginValues = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address"),
})

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

// The confirm error is attached to that field so it shows under it
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
