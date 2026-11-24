"use client"

import {
  Building2Icon,
  DoorOpenIcon,
  FileTextIcon,
  LandmarkIcon,
  PercentIcon,
  TriangleAlertIcon,
  WalletIcon,
} from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePropertyDashboard } from "@/hooks/use-properties"
import { formatCurrency } from "@/lib/format"
import { getErrorMessage } from "@/lib/api/errors"
import { Button } from "@/components/ui/button"

export function PropertyDashboard() {
  const query = usePropertyDashboard()
  const data = query.data

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Portfolio at a glance"
        title="Property overview"
        description="Occupancy, rent and deposit position across every property."
      />

      {query.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(query.error, "Couldn't load the portfolio.")}
          </p>
          <Button
            variant="outline"
            className="h-10 rounded-full px-5"
            onClick={() => query.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              icon={Building2Icon}
              label="Properties"
              value={String(data.total_properties)}
            />
            <Stat
              icon={DoorOpenIcon}
              label="Units occupied"
              value={`${data.occupied_units} / ${data.total_units}`}
            />
            <Stat
              icon={PercentIcon}
              label="Occupancy"
              value={`${data.occupancy_pct}%`}
            />
            <Stat
              icon={FileTextIcon}
              label="Active leases"
              value={String(data.active_leases)}
            />
            <Stat
              icon={WalletIcon}
              label="Monthly rent"
              value={formatCurrency(data.monthly_rent_kes)}
            />
            <Stat
              icon={LandmarkIcon}
              label="Deposits held"
              value={formatCurrency(data.deposits_kes)}
            />
            <Stat
              icon={LandmarkIcon}
              label="Service charge"
              value={formatCurrency(data.service_charge_kes)}
            />
            <Stat
              icon={TriangleAlertIcon}
              label="Deposit shortfalls"
              value={String(data.deposit_alerts.length)}
            />
          </div>

          <Card className="gap-0 rounded-2xl p-0">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-heading text-lg font-semibold">
                  Deposit shortfalls
                </h2>
                <p className="text-sm text-muted-foreground">
                  Active leases below their agreed deposit target.
                </p>
              </div>
            </div>
            {data.deposit_alerts.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                Every active lease has reached its deposit target.
              </p>
            ) : (
              <ul className="divide-y">
                {data.deposit_alerts.map((alert) => (
                  <li
                    key={alert.lease_id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                  >
                    <div>
                      <p className="font-medium">
                        {alert.full_name || alert.company_name || "Tenant"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {alert.property_alias} · {alert.unit_label}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-destructive">
                        {formatCurrency(alert.shortfall)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        of {formatCurrency(alert.required)} required
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      ) : null}
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <Card className="gap-3 rounded-2xl px-5 py-5 shadow-xs">
      <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <p className="mt-1 font-heading text-2xl font-bold">{value}</p>
      </div>
    </Card>
  )
}
