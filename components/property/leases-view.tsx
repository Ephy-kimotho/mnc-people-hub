"use client"

import {
  ArrowUpRightIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { LeaseDialog } from "@/components/property/lease-dialog"
import { useLeases } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import { formatCurrency, formatDate } from "@/lib/format"
import { canManageProperty } from "@/lib/permissions"
import type { Lease } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

const statusTone: Record<string, string> = {
  Active:
    "border-emerald-700/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  Draft:
    "border-amber-600/30 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  Pending:
    "border-amber-600/30 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  Expired: "border-border bg-muted text-muted-foreground",
  Terminated: "border-destructive/30 bg-destructive/10 text-destructive",
}

export function LeasesView() {
  const { user } = useAuth()
  const canManage = canManageProperty(user)
  const query = useLeases({})
  const [dialog, setDialog] = useState<"form" | null>(null)
  const [selected, setSelected] = useState<Lease>()

  function open(lease?: Lease) {
    setSelected(lease)
    setDialog("form")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tenancy agreements"
        title="Leases"
        description="Active agreements, rent routing, deposits, and monthly service-charge amounts."
        action={
          canManage && (
            <Button
              className="h-10 self-start rounded-full bg-emerald-800 px-5 text-white hover:bg-emerald-900"
              onClick={() => open()}
            >
              <PlusIcon />
              Draft Lease
            </Button>
          )
        }
      />

      <div className="flex items-center gap-3 rounded-2xl border bg-muted/40 px-5 py-4 text-sm">
        <ShieldCheckIcon className="size-5 shrink-0 text-emerald-800" />
        <p>All tenant deposits are held separately from monthly rent collection accounts.</p>
      </div>

      {query.isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
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
          <RefreshCwIcon className="size-5 text-emerald-800" />
          No leases yet. Draft the first one.
        </div>
      ) : (
        <Card className="gap-0 overflow-hidden rounded-2xl p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <th className="px-5 py-3">Tenant</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Term</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Rent</th>
                  <th className="px-5 py-3 text-right">Deposit</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {(query.data ?? []).map((lease) => (
                  <tr key={lease.lease_id} className="align-middle">
                    <td className="px-5 py-4 font-medium">
                      {lease.tenant_full_name ||
                        lease.tenant_company_name ||
                        "Tenant"}
                    </td>
                    <td className="px-5 py-4">
                      <p>{lease.property_alias}</p>
                      <p className="text-muted-foreground">{lease.unit_label}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2">
                        <RefreshCwIcon className="size-4 text-muted-foreground" />
                        {lease.end_date ? formatDate(lease.end_date) : "Ongoing"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant="outline"
                        className={`rounded-full ${statusTone[lease.status] ?? ""}`}
                      >
                        {lease.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <p className="font-medium">
                        {formatCurrency(lease.monthly_rent_kes ?? 0)}
                      </p>
                      {lease.monthly_rent_usd ? (
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(lease.monthly_rent_usd, "USD")}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <p className="font-medium">
                        {formatCurrency(lease.deposit_kes ?? 0)}
                      </p>
                      {lease.deposit_usd ? (
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(lease.deposit_usd, "USD")}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {canManage ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full"
                            onClick={() => open(lease)}
                          >
                            {query.isFetching ? (
                              <Loader2Icon className="animate-spin" />
                            ) : (
                              <PencilIcon />
                            )}
                            Edit
                          </Button>
                        ) : null}
                        {lease.property_id ? (
                          <Button
                            asChild
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-full"
                          >
                            <Link
                              href={`/property/properties/${lease.property_id}`}
                              aria-label="Open property"
                            >
                              <ArrowUpRightIcon />
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <LeaseDialog
        open={dialog === "form"}
        onOpenChange={(next) => !next && setDialog(null)}
        lease={selected}
      />
    </div>
  )
}
