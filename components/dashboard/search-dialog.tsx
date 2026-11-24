"use client"

import {
  Building2Icon,
  FileTextIcon,
  LayoutGridIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { allNavItems, canSeeNavItem } from "@/components/dashboard/nav-items"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  useLeases,
  useProperties,
  useTenants,
} from "@/hooks/use-properties"
import { canAccessProperty } from "@/lib/permissions"
import { useAuth } from "@/providers/auth-provider"

type Result = {
  href: string
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
}

/** Sidebar search with a ⌘K / Ctrl+K shortcut. */
export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState("")
  const router = useRouter()
  const { user } = useAuth()
  const propertyAccess = canAccessProperty(user)

  const properties = useProperties({ enabled: open && propertyAccess })
  const tenants = useTenants(undefined, { enabled: open && propertyAccess })
  const leases = useLeases({}, { enabled: open && propertyAccess })

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  function select(href: string) {
    setOpen(false)
    setTerm("")
    router.push(href)
  }

  const query = term.trim().toLowerCase()
  const results: Result[] = []

  // Pages the user can open
  for (const item of allNavItems) {
    if (!canSeeNavItem(item, user)) continue
    if (query && !item.title.toLowerCase().includes(query)) continue
    results.push({
      href: item.href,
      title: item.title,
      subtitle: "Page",
      icon: item.icon,
    })
  }

  if (propertyAccess) {
    for (const property of properties.data ?? []) {
      const haystack = [property.alias, property.county, property.location]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      if (query && !haystack.includes(query)) continue
      results.push({
        href: `/property/properties/${property.property_id}`,
        title: property.alias,
        subtitle: [property.location, property.county]
          .filter(Boolean)
          .join(" · "),
        icon: Building2Icon,
      })
    }

    for (const tenant of tenants.data ?? []) {
      const name = tenant.full_name || tenant.company_name || "Tenant"
      const haystack = [name, tenant.email, tenant.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      if (query && !haystack.includes(query)) continue
      results.push({
        href: "/property/tenants",
        title: name,
        subtitle: tenant.email || tenant.phone || "Tenant",
        icon: UsersIcon,
      })
    }

    for (const lease of leases.data ?? []) {
      const name =
        lease.tenant_full_name || lease.tenant_company_name || "Tenant"
      const haystack = [
        name,
        lease.property_alias,
        lease.unit_label,
        lease.lease_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      if (query && !haystack.includes(query)) continue
      results.push({
        href: "/property/leases",
        title: `${name} · ${lease.unit_label}`,
        subtitle: `${lease.property_alias} · ${lease.status}`,
        icon: FileTextIcon,
      })
    }
  }

  const visible = query ? results.slice(0, 12) : results.slice(0, 8)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-4 flex h-10 items-center gap-2 rounded-xl border bg-background px-3 text-sm text-muted-foreground shadow-xs transition-colors hover:bg-muted"
      >
        <SearchIcon className="size-4" />
        Search…
        <kbd className="ml-auto rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[0.65rem]">
          ⌘ K
        </kbd>
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setTerm("")
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="top-[12%] max-w-xl translate-y-0 gap-0 p-0"
        >
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="flex items-center gap-2 border-b px-4">
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
            <Input
              autoFocus
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && visible[0]) {
                  event.preventDefault()
                  select(visible[0].href)
                }
              }}
              placeholder="Search properties, tenants, leases, pages…"
              className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="max-h-[55vh] overflow-y-auto p-2">
            {visible.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Nothing matches “{term}”.
              </p>
            ) : (
              <ul>
                {visible.map((result, index) => (
                  <li key={`${result.href}-${result.title}-${index}`}>
                    <button
                      type="button"
                      onClick={() => select(result.href)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <result.icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {result.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {result.subtitle}
                        </span>
                      </span>
                      {result.subtitle === "Page" ? (
                        <LayoutGridIcon className="size-3.5 text-muted-foreground" />
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
            <span>Type to filter</span>
            <span>Enter to open · Esc to close</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
