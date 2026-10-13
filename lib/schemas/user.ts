import { z } from "zod"

import { PASSWORD_MIN } from "@/lib/schemas/auth"

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Use at least 3 characters")
    .regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, dots, dashes or _"),
  full_name: z.string().trim().min(1, "Full name is required"),
  email: z.string().trim().pipe(z.email("Enter a valid email address")),
  password: z.string().trim().min(PASSWORD_MIN),
  role: z.string().min(1, "Choose a role"),
})

export type CreateUserValues = z.infer<typeof createUserSchema>
