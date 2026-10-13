import { isAxiosError } from "axios"

type ValidationIssue = { msg?: string }

// The API returns `{ detail }`, either a message or a list of field issues
export function getErrorMessage(error: unknown, fallback: string) {
  if (!isAxiosError(error)) return fallback
  if (!error.response) return "Can't reach the server. Check your connection."

  const detail = (error.response.data as { detail?: unknown } | undefined)
    ?.detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    const message = (detail[0] as ValidationIssue | undefined)?.msg
    if (message) return message
  }
  return fallback
}
