"use client"

import {
  EllipsisVerticalIcon,
  ExternalLinkIcon,
  PlusIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { DeleteTenantDialog } from "@/components/property/delete-tenant-dialog"
import { TenantDialog } from "@/components/property/tenant-dialog"
import { useTenants } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import { canManageProperty } from "@/lib/permissions"
import type { Tenant } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

function displayName(tenant: Tenant) {
  return tenant.full_name || tenant.company_name || "Tenant"
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

const statusTone: Record<string, string> = {
  Active: "border-emerald-700/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  Inactive: "border-border bg-muted text-muted-foreground",
  Blacklisted: "border-destructive/30 bg-destructive/10 text-destructive",
}

export function TenantsView() {
  const { user } = useAuth()
  const canManage = canManageProperty(user)
  const query = useTenants()
  const [search, setSearch] = useState("")
  const [dialog, setDialog] = useState<"form" | "delete" | null>(null)
  const [selected, setSelected] = useState<Tenant>()

  function open(kind: "form" | "delete", tenant?: Tenant) {
    setSelected(tenant)
    setDialog(kind)
  }

  const term = search.trim().toLowerCase()
  const tenants = (query.data ?? []).filter((tenant) => {
    if (!term) return true
    return [
      tenant.full_name,
      tenant.company_name,
      tenant.mobile,
      tenant.phone,
      tenant.email,
      tenant.unit_label,
      tenant.property_alias,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(term)
  })

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Tenant register"
        title="Tenants"
        description="Individuals and companies renting across the portfolio."
        action={
          canManage && (
            <Button
              className="h-10 self-start rounded-full bg-emerald-800 px-5 text-white hover:bg-emerald-900"
              onClick={() => open("form")}
            >
              <PlusIcon />
              Add Tenant
            </Button>
          )
        }
      />

      <div className="relative max-w-md">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, phone, email, unit or property…"
          className="h-11 rounded-full pl-9"
        />
      </div>

      {query.isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(query.error, "Couldn't load tenants.")}
          </p>
          <Button
            variant="outline"
            className="h-10 rounded-full px-5"
            onClick={() => query.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : tenants.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          <UsersIcon className="size-5 text-emerald-800" />
          {query.data?.length === 0
            ? "No tenants yet. Add the first one."
            : "No tenants match this search."}
        </div>
      ) : (
        <Card className="gap-0 rounded-2xl p-0">
          <ul className="divide-y">
            {tenants.map((tenant) => {
              const name = displayName(tenant)
              return (
                <li
                  key={tenant.tenant_id}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 font-heading text-sm font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                      {initials(name) || "T"}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/property/tenants/${tenant.tenant_id}`}
                        className="truncate font-medium hover:underline"
                      >
                        {name}
                      </Link>
                      <p className="truncate text-sm text-muted-foreground">
                        {tenant.unit_label
                          ? `${tenant.property_alias ?? "Property"} · ${tenant.unit_label}`
                          : "No active lease"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {tenant.property_id ? (
                      <Link
                        href={`/property/properties/${tenant.property_id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                      >
                        View Property
                        <ExternalLinkIcon className="size-3.5" />
                      </Link>
                    ) : null}
                    <Badge
                      variant="outline"
                      className={`rounded-full ${statusTone[tenant.status] ?? ""}`}
                    >
                      {tenant.status}
                    </Badge>
                    {canManage ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-full"
                          >
                            <EllipsisVerticalIcon />
                            <span className="sr-only">Actions for {name}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild>
                            <Link href={`/property/tenants/${tenant.tenant_id}`}>
                              Open
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => open("form", tenant)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => open("delete", tenant)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <TenantDialog
        open={dialog === "form"}
        onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        tenant={selected}
      />
      <DeleteTenantDialog
        open={dialog === "delete"}
        onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        tenant={selected}
      />
    </div>
  )
}
