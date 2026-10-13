import { Loader2Icon } from "lucide-react"

// Full-screen spinner shown while the session is restored or a redirect runs
export function WorkspaceLoader() {
  return (
    <div
      role="status"
      className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background text-muted-foreground"
    >
      <Loader2Icon className="size-8 animate-spin text-brand" />
      <p className="text-sm">Loading your workspace…</p>
    </div>
  )
}
