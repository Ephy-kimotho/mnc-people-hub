"use client"

import {
  Building2Icon,
  CalendarDaysIcon,
  FileTextIcon,
  PercentIcon,
  ShieldIcon,
  TriangleAlertIcon,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { format } from "date-fns"

import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useFxRate, usePropertyDashboard } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import { formatAmount, formatCurrency, formatDate } from "@/lib/format"

type ViewMode = "native" | "kes" | "usd"

export function PropertyDashboard() {
  const query = usePropertyDashboard()
  const fx = useFxRate()
  const [view, setView] = useState<ViewMode>("native")
  const data = query.data
  const rate = fx.data?.rate ?? null
  const routingRows = data?.routing ?? []
  const maxRentKes = Math.max(0, ...routingRows.map((row) => row.rent_kes))
  const maxRentUsd = Math.max(0, ...routingRows.map((row) => row.rent_usd))
  const maxServiceKes = Math.max(
    0,
    ...routingRows.map((row) => row.service_charge_kes)
  )

  function total(kes: number, usd: number) {
    if (!rate) return null
    if (view === "kes") return formatCurrency(kes + usd * rate)
    if (view === "usd") return formatCurrency(kes / rate + usd, "USD")
    return null
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Portfolio at a glance"
        title="Portfolio Overview"
        description="Manage your family's properties, monitor occupancy, and stay on top of critical lease events."
        action={
          <Button
            asChild
            variant="outline"
            className="h-10 self-start rounded-full px-5"
          >
            <Link href="/property/properties">Edit unit default rents</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card px-5 py-4">
        <div className="flex items-center gap-1 rounded-full bg-muted p-1">
          {(
            [
              ["native", "Native Split"],
              ["kes", "Total KES"],
              ["usd", "Total USD"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={
                view === id
                  ? "rounded-full bg-background px-3 py-1.5 text-xs font-semibold shadow-xs"
                  : "px-3 py-1.5 text-xs font-medium text-muted-foreground"
              }
            >
              {label}
            </button>
          ))}
        </div>
        <div className="text-right text-sm">
          {fx.isPending ? (
            <span className="text-muted-foreground">Loading rate…</span>
          ) : fx.isError || !fx.data ? (
            <span className="text-muted-foreground">Rate unavailable</span>
          ) : (
            <>
              <p className="font-semibold">
                1 USD = {fx.data.rate.toLocaleString()} KES
              </p>
              <p className="text-xs text-muted-foreground">
                {fx.data.source} · {formatDate(fx.data.as_of)}
              </p>
            </>
          )}
        </div>
      </div>

      {query.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-36 rounded-2xl" />
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Stat
              icon={Building2Icon}
              label="Total properties"
              value={String(data.total_properties)}
              note={`${data.total_units} units total`}
            />
            <Stat
              icon={PercentIcon}
              label="Occupancy rate"
              value={`${data.occupancy_pct}%`}
              note={`${data.occupied_units} of ${data.total_units} units occupied`}
              progress={data.occupancy_pct}
            />
            <MoneyStat
              icon={CalendarDaysIcon}
              label="Monthly rent"
              kes={data.monthly_rent_kes}
              usd={data.monthly_rent_usd}
              view={view}
              total={total}
              note={
                data.tenants_without_rent
                  ? `${data.tenants_without_rent} tenants have no entered rent and are excluded.`
                  : "Only rent entered on active leases is counted."
              }
            />
            <MoneyStat
              icon={ShieldIcon}
              label="Deposits held"
              kes={data.deposits_kes}
              usd={data.deposits_usd}
              view={view}
              total={total}
            />
            <Stat
              icon={FileTextIcon}
              label="Monthly service charge"
              value={formatCurrency(data.service_charge_kes)}
              note="Configured monthly charges on tenant leases, including active leases starting soon."
            />
            <Stat
              icon={TriangleAlertIcon}
              label="Deposit shortfalls"
              value={String(data.deposit_alerts.length)}
              note="Active leases below their deposit target."
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="gap-0 rounded-2xl p-0">
              <div className="border-b px-5 py-4">
                <h2 className="font-heading text-lg font-semibold">
                  Occupancy by property
                </h2>
              </div>
              {data.occupancy_by_property.length === 0 ? (
                <p className="px-5 py-8 text-sm text-muted-foreground">
                  No properties yet.
                </p>
              ) : (
                <ul className="divide-y">
                  {data.occupancy_by_property.map((row) => {
                    const pct = row.total_units
                      ? Math.round((row.occupied_units / row.total_units) * 100)
                      : 0
                    return (
                      <li key={row.property_id} className="px-5 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium">
                            {row.alias}
                          </span>
                          <span className="rounded-full border px-2 py-0.5 text-xs">
                            {row.occupied_units} / {row.total_units}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-emerald-600"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>

            <Card className="gap-0 rounded-2xl p-0">
              <div className="border-b px-5 py-4">
                <h2 className="font-heading text-lg font-semibold">
                  Entered tenant rent by property
                </h2>
                <p className="text-xs text-muted-foreground">
                  Each currency uses its own scale; amounts are not combined.
                </p>
              </div>
              {data.rent_by_property.length === 0 ? (
                <p className="px-5 py-8 text-sm text-muted-foreground">
                  No properties yet.
                </p>
              ) : (
                <ul className="divide-y">
                  {data.rent_by_property.map((row) => (
                    <li key={row.property_id} className="space-y-2 px-5 py-3">
                      <p className="text-sm font-medium">{row.alias}</p>
                      <BarLine
                        label="KES"
                        value={formatCurrency(row.kes)}
                        percent={percentOf(row.kes, max(data.rent_by_property, "kes"))}
                        tone="bg-brand"
                      />
                      <BarLine
                        label="USD"
                        value={formatCurrency(row.usd, "USD")}
                        percent={percentOf(row.usd, max(data.rent_by_property, "usd"))}
                        tone="bg-emerald-600"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <Card className="gap-0 rounded-2xl p-0">
              <div className="border-b px-5 py-4">
                <p className="text-[0.7rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Monthly routing
                </p>
                <h2 className="font-heading text-lg font-semibold">
                  Expected by receiving account
                </h2>
                <p className="text-xs text-muted-foreground">
                  Estimated monthly rent and service charge routed to each
                  destination. These are not payments received.
                </p>
                <Badge variant="outline" className="mt-2">
                  Estimated, not collected
                </Badge>
              </div>

              <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <Total label="Total rent · KES" value={formatCurrency(routingTotal(data.routing, "rent_kes"))} />
                <Total label="Total rent · USD" value={formatCurrency(routingTotal(data.routing, "rent_usd"), "USD")} />
                <Total label="Total service charge · KES" value={formatCurrency(routingTotal(data.routing, "service_charge_kes"))} />
              </div>

              <div className="border-t px-5 py-4">
                <p className="text-[0.7rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Destination breakdown
                </p>
                {data.routing.length === 0 ? (
                  <p className="py-6 text-sm text-muted-foreground">
                    No active leases to route yet.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    <div className="hidden gap-4 px-4 text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase sm:grid sm:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
                      <span>Destination</span>
                      <span>Rent · KES</span>
                      <span>Rent · USD</span>
                      <span>Service charge · KES</span>
                    </div>
                    {data.routing.map((row, index) => (
                      <div
                        key={row.account_id ?? `unassigned-${index}`}
                        className={
                          row.assigned
                            ? "rounded-xl border px-4 py-3"
                            : "rounded-xl border border-amber-300 bg-amber-50/60 px-4 py-3 dark:bg-amber-950/20"
                        }
                      >
                        <div className="grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] sm:items-end">
                          <div>
                            <p className="text-sm font-medium">
                              {row.assigned
                                ? `${row.bank_name} · ${row.account_name}`
                                : "No receiving account set"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {row.assigned
                                ? "Destination assigned"
                                : "Destination not assigned"}
                            </p>
                          </div>
                          <RoutingBar
                            label="Rent · KES"
                            value={row.rent_kes}
                            max={maxRentKes}
                            tone="bg-brand"
                          />
                          <RoutingBar
                            label="Rent · USD"
                            value={row.rent_usd}
                            max={maxRentUsd}
                            tone="bg-sky-500"
                          />
                          <RoutingBar
                            label="Service charge · KES"
                            value={row.service_charge_kes}
                            max={maxServiceKes}
                            tone="bg-emerald-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  Unassigned amounts have no receiving bank account set.
                </p>
              </div>
            </Card>

            <Card className="gap-3 rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="size-4 text-brand-ink" />
                <h2 className="font-heading text-lg font-semibold">
                  Upcoming events
                </h2>
              </div>
              {data.upcoming_events.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No lease events in the next 180 days.
                </p>
              ) : (
                <ul className="space-y-3">
                  {data.upcoming_events.map((event) => (
                    <li
                      key={event.lease_id}
                      className="flex gap-3 rounded-xl border p-3"
                    >
                      <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg border text-center">
                        <span className="text-[0.6rem] font-semibold uppercase text-muted-foreground">
                          {format(new Date(event.end_date), "MMM")}
                        </span>
                        <span className="font-heading text-lg font-bold leading-none">
                          {format(new Date(event.end_date), "d")}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {event.tenant_name ?? "Tenant"} · {event.property_alias}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.tenure ?? "Lease"} · ends{" "}
                          {formatDate(event.end_date)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card className="gap-0 rounded-2xl p-0">
            <div className="border-b px-5 py-4">
              <h2 className="font-heading text-lg font-semibold">
                Deposit shortfalls
              </h2>
              <p className="text-sm text-muted-foreground">
                Active leases below their agreed deposit target.
              </p>
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
  note,
  progress,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  note?: string
  progress?: number
}) {
  return (
    <Card className="gap-3 rounded-2xl p-5 shadow-xs">
      <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <p className="mt-1 font-heading text-2xl font-bold">{value}</p>
        {progress !== undefined ? (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-600"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        ) : null}
        {note ? (
          <p className="mt-1 text-xs text-muted-foreground">{note}</p>
        ) : null}
      </div>
    </Card>
  )
}

function MoneyStat({
  icon,
  label,
  kes,
  usd,
  view,
  total,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  kes: number
  usd: number
  view: ViewMode
  total: (kes: number, usd: number) => string | null
  note?: string
}) {
  const Icon = icon
  return (
    <Card className="gap-3 rounded-2xl p-5 shadow-xs">
      <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <p className="mt-1 font-heading text-2xl font-bold">
          {view === "native"
            ? formatCurrency(kes)
            : (total(kes, usd) ?? formatCurrency(kes))}
        </p>
        {view === "native" ? (
          <p className="text-sm font-semibold text-muted-foreground">
            + {formatCurrency(usd, "USD")}
          </p>
        ) : null}
        {note ? (
          <p className="mt-1 text-xs text-muted-foreground">{note}</p>
        ) : null}
      </div>
    </Card>
  )
}

function BarLine({
  label,
  value,
  percent,
  tone,
}: {
  label: string
  value: string
  percent: number
  tone: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${tone}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function RoutingBar({
  label,
  value,
  max,
  tone,
}: {
  label: string
  value: number
  max: number
  tone: string
}) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="min-w-0">
      <p className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase sm:hidden">
        {label}
      </p>
      <p className="text-sm font-medium">{formatAmount(value)}</p>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${tone}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 font-heading text-lg font-bold">{value}</p>
    </div>
  )
}

function max(
  rows: { kes: number; usd: number }[],
  key: "kes" | "usd"
): number {
  return rows.reduce((best, row) => Math.max(best, row[key]), 0)
}

function percentOf(value: number, maxValue: number) {
  return maxValue > 0 ? Math.round((value / maxValue) * 100) : 0
}

function routingTotal(
  rows: { rent_kes: number; rent_usd: number; service_charge_kes: number }[],
  key: "rent_kes" | "rent_usd" | "service_charge_kes"
) {
  return rows.reduce((sum, row) => sum + row[key], 0)
}
