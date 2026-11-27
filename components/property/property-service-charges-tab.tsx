"use client"

import { ReceiptTextIcon } from "lucide-react"
import Link from "next/link"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useTenants } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import { formatCurrency } from "@/lib/format"
import type { Property } from "@/lib/types"

export function PropertyServiceChargesTab({
  property,
  propertyId,
}: {
  property: Property
  propertyId: string
}) {
  const query = useTenants(propertyId)
  const tenants = (query.data ?? []).filter((tenant) => tenant.lease_id)

  return (
    <div className="grid gap-4 p-5">
      <div>
        <h2 className="font-heading text-lg font-semibold">
          Monthly service charges
        </h2>
        <p className="text-sm text-muted-foreground">
          Set each tenant&apos;s recurring service charge on their lease. The
          monthly total is calculated from those amounts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="gap-2 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Total monthly service charges
          </p>
          <p className="font-heading text-2xl font-bold">
            {formatCurrency(property.service_charge_kes ?? 0)}
          </p>
        </Card>
        <Card className="gap-2 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Tenants without a configured amount
          </p>
          <p className="font-heading text-2xl font-bold">
            {property.tenants_without_service_charge ?? 0}
          </p>
        </Card>
      </div>

      {query.isPending ? (
        <Skeleton className="h-32 rounded-2xl" />
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(query.error, "Couldn't load service charges.")}
        </p>
      ) : tenants.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          <ReceiptTextIcon className="size-5 text-emerald-800" />
          No active leases on this property.
        </div>
      ) : (
        <Card className="gap-0 overflow-hidden rounded-2xl p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <th className="px-5 py-3">Tenant / Unit</th>
                  <th className="px-5 py-3 text-right">Monthly charge (KES)</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {tenants.map((tenant) => (
                  <tr key={tenant.tenant_id}>
                    <td className="px-5 py-3">
                      <p className="font-medium">
                        {tenant.full_name ||
                          tenant.company_name ||
                          "Tenant"}
                      </p>
                      <p className="text-muted-foreground">
                        {tenant.unit_label ?? "—"}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {tenant.service_charge_kes ? (
                        formatCurrency(tenant.service_charge_kes)
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/property/tenants/${tenant.tenant_id}`}
                        className="text-sm italic text-muted-foreground hover:text-foreground hover:underline"
                      >
                        <span className="hidden sm:inline">
                          Edit in tenant profile
                        </span>
                        <span className="sm:hidden">Edit</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
