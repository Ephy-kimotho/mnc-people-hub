import { z } from "zod"

export const LOCATION_NAME_MAX = 120
export const LOCATION_ADDRESS_MAX = 200

export const locationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Location name is required")
    .max(LOCATION_NAME_MAX, `Keep it under ${LOCATION_NAME_MAX} characters`),
  address: z
    .string()
    .trim()
    .max(
      LOCATION_ADDRESS_MAX,
      `Keep it under ${LOCATION_ADDRESS_MAX} characters`
    ),
})

export type LocationValues = z.infer<typeof locationSchema>
