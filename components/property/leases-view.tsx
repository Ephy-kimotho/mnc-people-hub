"use client"

import { EllipsisVerticalIcon, FileTextIcon, PlusIcon } from "lucide-react"
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
import { DeleteLeaseDialog } from "@/components/property/delete-lease-dialog"
import { LeaseDialog } from "@/components/property/lease-dialog"
import { useLeases } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import { formatCurrency, formatDate } from "@/lib/format"
import { canManageProperty } from "@/lib/permissions"
import type { Lease } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

export function LeasesView() {
  const { user } = useAuth()
  const canManage = canManageProperty(user)
  const query = useLeases({})
  const [dialog, setDialog] = useState<"form" | "delete" | null>(null)
  const [selected, setSelected] = useState<Lease>()

  function open(kind: "form" | "delete", lease?: Lease) {
    setSelected(lease)
    setDialog(kind)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Tenancy agreements"
        title="Leases"
        description="Active and past tenancies, with rent and deposit position."
        action={
          canManage && (
            <Button
              className="h-10 self-start rounded-full px-5"
              onClick={() => open("form")}
            >
              <PlusIcon />
              Add lease
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
            {getErrorMessage(query.error, "Couldn't load leases.")}
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
          <FileTextIcon className="size-5 text-brand-ink" />
          No leases yet.
        </div>
      ) : (
        <Card className="gap-0 rounded-2xl p-0">
          <ul className="divide-y">
            {(query.data ?? []).map((lease) => (
              <li
                key={lease.lease_id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {lease.tenant_full_name ||
                      lease.tenant_company_name ||
                      "Tenant"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {lease.property_alias} · {lease.unit_label} ·{" "}
                    {lease.start_date ? formatDate(lease.start_date) : "—"} to{" "}
                    {lease.end_date ? formatDate(lease.end_date) : "open"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {lease.monthly_rent_kes
                        ? formatCurrency(lease.monthly_rent_kes)
                        : lease.monthly_rent_usd
                          ? formatCurrency(lease.monthly_rent_usd, "USD")
                          : "No rent set"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Deposit {formatCurrency(lease.deposit_kes)}
                    </p>
                  </div>
                  <Badge
                    variant={lease.status === "Active" ? "secondary" : "outline"}
                  >
                    {lease.status}
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
                          <span className="sr-only">Lease actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onSelect={() => open("form", lease)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => open("delete", lease)}
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

      <LeaseDialog
        open={dialog === "form"}
        onOpenChange={(next) => !next && setDialog(null)}
        lease={selected}
      />
      <DeleteLeaseDialog
        open={dialog === "delete"}
        onOpenChange={(next) => !next && setDialog(null)}
        lease={selected}
      />
    </div>
  )
}
