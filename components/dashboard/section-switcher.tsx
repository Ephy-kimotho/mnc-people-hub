"use client"

import { Building2Icon, UsersIcon } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import { sectionForPath } from "@/components/dashboard/nav-items"
import { canAccessProperty } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/auth-provider"

const tabs = [
  { id: "people", label: "People", href: "/overview", icon: UsersIcon },
  {
    id: "property",
    label: "Property",
    href: "/property",
    icon: Building2Icon,
  },
] as const

/** Switches the sidebar between the People and Property workspaces. */
export function SectionSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const active = sectionForPath(pathname)
  const visible = tabs.filter(
    (tab) => tab.id === "people" || canAccessProperty(user)
  )

  return (
    <div
      className={cn(
        "mx-4 mb-2 grid gap-1 rounded-full bg-muted p-1",
        visible.length === 2 ? "grid-cols-2" : "grid-cols-1"
      )}
    >
      {visible.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => router.push(tab.href)}
            className={cn(
              "flex h-9 items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
