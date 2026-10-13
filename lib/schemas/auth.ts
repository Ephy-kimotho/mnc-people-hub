import { z } from "zod"

export const PASSWORD_MIN = 8

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().trim().min(1, "Password is required"),
})

export type LoginValues = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().trim().pipe(z.email("Enter a valid email address")),
})

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

// The confirm error is attached to that field so it shows under it
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .trim()
      .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`),
    confirmPassword: z.string().trim().min(1, "Confirm your new password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

// Used when an account still has the temporary password it was issued with
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().trim().min(1, "Enter your current password"),
    password: z
      .string()
      .trim()
      .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`),
    confirmPassword: z.string().trim().min(1, "Confirm your new password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((values) => values.password !== values.currentPassword, {
    message: "Choose a password different from the current one",
    path: ["password"],
  })

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>
