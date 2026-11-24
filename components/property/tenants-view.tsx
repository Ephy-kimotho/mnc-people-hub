"use client"

import { EllipsisVerticalIcon, PlusIcon, UsersIcon } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { DeleteTenantDialog } from "@/components/property/delete-tenant-dialog"
import { TenantDialog } from "@/components/property/tenant-dialog"
import { useTenants } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import { canManageProperty } from "@/lib/permissions"
import type { Tenant } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

export function TenantsView() {
  const { user } = useAuth()
  const canManage = canManageProperty(user)
  const query = useTenants()
  const [dialog, setDialog] = useState<"form" | "delete" | null>(null)
  const [selected, setSelected] = useState<Tenant>()

  function open(kind: "form" | "delete", tenant?: Tenant) {
    setSelected(tenant)
    setDialog(kind)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Who rents from you"
        title="Tenants"
        description="Individuals and companies with a lease in the portfolio."
        action={
          canManage && (
            <Button
              className="h-10 self-start rounded-full px-5"
              onClick={() => open("form")}
            >
              <PlusIcon />
              Add tenant
            </Button>
          )
        }
      />

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
      ) : (query.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          <UsersIcon className="size-5 text-brand-ink" />
          No tenants yet.
        </div>
      ) : (
        <Card className="gap-0 rounded-2xl p-0">
          <ul className="divide-y">
            {(query.data ?? []).map((tenant) => (
              <li
                key={tenant.tenant_id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {tenant.full_name || tenant.company_name || "Tenant"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {[tenant.phone, tenant.email].filter(Boolean).join(" · ") ||
                      "No contact details"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="capitalize">
                    {tenant.type}
                  </Badge>
                  <Badge
                    variant={tenant.status === "Active" ? "secondary" : "outline"}
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
                          <span className="sr-only">Tenant actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
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
            ))}
          </ul>
        </Card>
      )}

      <TenantDialog
        open={dialog === "form"}
        onOpenChange={(next) => !next && setDialog(null)}
        tenant={selected}
      />
      <DeleteTenantDialog
        open={dialog === "delete"}
        onOpenChange={(next) => !next && setDialog(null)}
        tenant={selected}
      />
    </div>
  )
}
