"use client"

import { ShieldOffIcon } from "lucide-react"
import { usePathname } from "next/navigation"

import { Card } from "@/components/ui/card"
import { canAccessPage } from "@/lib/permissions"
import { useAuth } from "@/providers/auth-provider"

// Shows a notice instead of the page when the user's role can't open it,
// so typing a hidden page into the address bar doesn't get around the sidebar
export function PageGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()

  if (!user || canAccessPage(user, pathname)) return children

  return (
    <Card className="mx-auto max-w-md items-center gap-3 rounded-2xl px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ShieldOffIcon className="size-5" />
      </span>
      <h1 className="font-heading text-xl font-semibold">No access</h1>
      <p className="text-sm text-muted-foreground">
        Your account doesn&apos;t have permission to view this page.
      </p>
    </Card>
  )
}
