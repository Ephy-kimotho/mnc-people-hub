export { cn } from "cn"

// Waits for `ms` milliseconds, used to simulate network requests
export const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))
