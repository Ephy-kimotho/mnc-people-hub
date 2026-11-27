"use client"

import { addMonths, format } from "date-fns"
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ScrollTextIcon,
  UserIcon,
  WalletIcon,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeaseDialog } from "@/components/property/lease-dialog"
import { RentPaymentDialog } from "@/components/property/rent-payment-dialog"
import {
  useDepositTopups,
  useLeases,
  useRentCollection,
} from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import { formatCurrency } from "@/lib/format"
import { canManageProperty } from "@/lib/permissions"
import type { DepositTopup, Lease, RentCollection } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

function periodKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function RemindersView() {
  const { user } = useAuth()
  const canManage = canManageProperty(user)
  const [month, setMonth] = useState(() => new Date())
  const period = periodKey(month)
  const rent = useRentCollection(period)
  const deposits = useDepositTopups()
  const leases = useLeases({})
  const [paying, setPaying] = useState<RentCollection>()
  const [editingLease, setEditingLease] = useState<Lease>()

  const rentRows = rent.data ?? []
  const rentTotal = rentRows.reduce(
    (sum, row) => sum + Math.max(0, row.outstanding_kes ?? 0),
    0
  )
  const depositRows = deposits.data ?? []
  const depositTotalUsd = depositRows.reduce(
    (sum, row) => sum + Math.max(0, row.shortfall_usd ?? 0),
    0
  )
  const depositTotalKes = depositRows.reduce(
    (sum, row) => sum + Math.max(0, row.shortfall_kes ?? 0),
    0
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Collections"
        title="Payment Reminders"
        description="Track outstanding rent and deposit top-ups."
        action={
          <div className="flex items-center gap-1 rounded-full border px-1 py-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              aria-label="Previous month"
              onClick={() => setMonth((current) => addMonths(current, -1))}
            >
              <ChevronLeftIcon />
            </Button>
            <span className="min-w-32 text-center text-sm font-medium">
              {format(month, "MMMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              aria-label="Next month"
              onClick={() => setMonth((current) => addMonths(current, 1))}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="gap-2 rounded-2xl p-5 shadow-xs">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <ScrollTextIcon className="size-4" />
            Rent outstanding
          </p>
          <p className="font-heading text-2xl font-bold">
            {formatCurrency(rentTotal)}{" "}
            <span className="text-sm font-medium text-muted-foreground">
              / {rentRows.length} leases
            </span>
          </p>
        </Card>
        <Card className="gap-2 rounded-2xl p-5 shadow-xs">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <ScrollTextIcon className="size-4" />
            Deposit top-ups needed
          </p>
          <p className="font-heading text-2xl font-bold">
            {depositTotalUsd > 0
              ? formatCurrency(depositTotalUsd, "USD")
              : formatCurrency(depositTotalKes)}{" "}
            <span className="text-sm font-medium text-muted-foreground">
              / {depositRows.length} leases
            </span>
          </p>
        </Card>
      </div>

      <Tabs defaultValue="rent" className="gap-4">
        <TabsList variant="line" className="w-fit gap-2">
          <TabsTrigger value="rent" className="px-3">
            Rent Outstanding ({rentRows.length})
          </TabsTrigger>
          <TabsTrigger value="deposits" className="px-3">
            Deposit Top-ups ({depositRows.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rent">
          {rent.isPending ? (
            <TableSkeleton />
          ) : rent.isError ? (
            <ErrorBlock
              message={getErrorMessage(rent.error, "Couldn't load rent.")}
              onRetry={() => rent.refetch()}
            />
          ) : rentRows.length === 0 ? (
            <EmptyBlock message="No active leases to collect for this period." />
          ) : (
            <>
              <div className="grid gap-3 sm:hidden">
                {rentRows.map((row) => {
                  const status = rentStatus(row)
                  const balance = Math.max(0, row.outstanding_kes ?? 0)
                  const unconfigured = (row.expected_kes ?? 0) <= 0
                  return (
                    <Card
                      key={row.lease_id}
                      className="gap-3 rounded-2xl p-4 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {row.tenant_full_name ||
                              row.tenant_company_name ||
                              "Tenant"}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            {row.property_alias} • {row.unit_label}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            status === "Unconfigured"
                              ? "shrink-0 rounded-full"
                              : status === "Paid"
                                ? "shrink-0 rounded-full border-emerald-700/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                                : "shrink-0 rounded-full border-amber-600/30 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                          }
                        >
                          {status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
                            Expected
                          </p>
                          <p className="mt-0.5">
                            {formatCurrency(row.expected_kes ?? 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
                            Paid
                          </p>
                          <p className="mt-0.5">
                            {formatCurrency(row.paid_kes ?? 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
                            Balance
                          </p>
                          <p
                            className={`mt-0.5 font-semibold ${balance > 0 ? "text-amber-600" : ""}`}
                          >
                            {formatCurrency(balance)}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end border-t pt-2">
                        {unconfigured ? (
                          <button
                            type="button"
                            className="text-sm italic text-muted-foreground hover:text-foreground hover:underline"
                            onClick={() => {
                              const lease = leases.data?.find(
                                (item) => item.lease_id === row.lease_id
                              )
                              if (lease) setEditingLease(lease)
                            }}
                          >
                            Configure rent
                          </button>
                        ) : canManage ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => setPaying(row)}
                          >
                            Record payment
                          </Button>
                        ) : null}
                      </div>
                    </Card>
                  )
                })}
              </div>

              <Card className="hidden gap-0 overflow-hidden rounded-2xl p-0 sm:flex">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        <th className="px-5 py-3">Tenant</th>
                        <th className="px-5 py-3">Property / Unit</th>
                        <th className="px-5 py-3 text-right">Expected</th>
                        <th className="px-5 py-3 text-right">Paid</th>
                        <th className="px-5 py-3 text-right">Balance</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {rentRows.map((row) => {
                        const balance = Math.max(0, row.outstanding_kes ?? 0)
                        const expected = row.expected_kes ?? 0
                        const unconfigured = expected <= 0
                        const status = rentStatus(row)
                        return (
                          <tr key={row.lease_id}>
                            <td className="px-5 py-3 font-medium">
                              <span className="inline-flex items-center gap-2">
                                <UserIcon className="size-3.5 text-muted-foreground" />
                                {row.tenant_full_name ||
                                  row.tenant_company_name ||
                                  "Tenant"}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-muted-foreground">
                              {row.property_alias} • {row.unit_label}
                            </td>
                            <td className="px-5 py-3 text-right">
                              {formatCurrency(expected)}
                            </td>
                            <td className="px-5 py-3 text-right">
                              {formatCurrency(row.paid_kes ?? 0)}
                            </td>
                            <td
                              className={`px-5 py-3 text-right font-semibold ${balance > 0 ? "text-amber-600" : ""}`}
                            >
                              {formatCurrency(balance)}
                            </td>
                            <td className="px-5 py-3">
                              <Badge
                                variant="outline"
                                className={
                                  status === "Unconfigured"
                                    ? "rounded-full"
                                    : status === "Paid"
                                      ? "rounded-full border-emerald-700/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                                      : "rounded-full border-amber-600/30 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                                }
                              >
                                {status}
                              </Badge>
                            </td>
                            <td className="px-5 py-3 text-right">
                              {unconfigured ? (
                                <button
                                  type="button"
                                  className="text-sm italic text-muted-foreground hover:text-foreground hover:underline"
                                  onClick={() => {
                                    const lease = leases.data?.find(
                                      (item) => item.lease_id === row.lease_id
                                    )
                                    if (lease) setEditingLease(lease)
                                  }}
                                >
                                  Configure rent
                                </button>
                              ) : canManage ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="rounded-full"
                                  onClick={() => setPaying(row)}
                                >
                                  Record
                                </Button>
                              ) : null}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="deposits">
          {deposits.isPending ? (
            <TableSkeleton />
          ) : deposits.isError ? (
            <ErrorBlock
              message={getErrorMessage(
                deposits.error,
                "Couldn't load deposit top-ups."
              )}
              onRetry={() => deposits.refetch()}
            />
          ) : depositRows.length === 0 ? (
            <EmptyBlock message="Every active lease has reached its deposit target." />
          ) : (
            <>
              <div className="grid gap-3 sm:hidden">
                {depositRows.map((row) => (
                  <DepositMobileCard key={row.lease_id} row={row} />
                ))}
              </div>

              <Card className="hidden gap-0 overflow-hidden rounded-2xl p-0 sm:flex">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        <th className="px-5 py-3">Tenant</th>
                        <th className="px-5 py-3">Property / Unit</th>
                        <th className="px-5 py-3 text-right">Held</th>
                        <th className="px-5 py-3 text-right">Required</th>
                        <th className="px-5 py-3 text-right">Shortfall</th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {depositRows.map((row) => (
                        <DepositRow key={row.lease_id} row={row} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      <RentPaymentDialog
        open={Boolean(paying)}
        onOpenChange={(next) => !next && setPaying(undefined)}
        row={paying}
        period={period}
      />
      <LeaseDialog
        open={Boolean(editingLease)}
        onOpenChange={(next) => !next && setEditingLease(undefined)}
        lease={editingLease}
      />
    </div>
  )
}

function rentStatus(row: RentCollection) {
  const balance = Math.max(0, row.outstanding_kes ?? 0)
  if ((row.expected_kes ?? 0) <= 0) return "Unconfigured"
  if (balance <= 0) return "Paid"
  return (row.paid_kes ?? 0) > 0 ? "Partial" : "Unpaid"
}

function DepositMobileCard({ row }: { row: DepositTopup }) {
  const usd = row.shortfall_usd > 0
  const currency = usd ? "USD" : "KES"
  const held = usd ? row.deposit_usd : row.deposit_kes
  const required = usd ? row.required_usd : row.required_kes
  const shortfall = usd ? row.shortfall_usd : row.shortfall_kes

  return (
    <Card className="gap-3 rounded-2xl p-4 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{row.tenant_name || "Tenant"}</p>
          <p className="truncate text-sm text-muted-foreground">
            {row.property_alias} • {row.unit_label}
          </p>
        </div>
        <Link
          href={`/property/tenants/${row.tenant_id}`}
          className="shrink-0 text-sm italic text-muted-foreground hover:text-foreground hover:underline"
        >
          View
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
            Held
          </p>
          <p className="mt-0.5">{formatCurrency(held ?? 0, currency)}</p>
        </div>
        <div>
          <p className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
            Required
          </p>
          <p className="mt-0.5">{formatCurrency(required ?? 0, currency)}</p>
        </div>
        <div>
          <p className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
            Shortfall
          </p>
          <p className="mt-0.5 font-semibold text-amber-600">
            {formatCurrency(shortfall ?? 0, currency)}
          </p>
        </div>
      </div>
    </Card>
  )
}

function DepositRow({ row }: { row: DepositTopup }) {
  const usd = row.shortfall_usd > 0
  const currency = usd ? "USD" : "KES"
  const held = usd ? row.deposit_usd : row.deposit_kes
  const required = usd ? row.required_usd : row.required_kes
  const shortfall = usd ? row.shortfall_usd : row.shortfall_kes

  return (
    <tr>
      <td className="px-5 py-3 font-medium">
        <span className="inline-flex items-center gap-2">
          <WalletIcon className="size-3.5 text-muted-foreground" />
          {row.tenant_name || "Tenant"}
        </span>
      </td>
      <td className="px-5 py-3 text-muted-foreground">
        {row.property_alias} • {row.unit_label}
      </td>
      <td className="px-5 py-3 text-right">
        {formatCurrency(held ?? 0, currency)}
      </td>
      <td className="px-5 py-3 text-right">
        {formatCurrency(required ?? 0, currency)}
      </td>
      <td className="px-5 py-3 text-right font-semibold text-amber-600">
        {formatCurrency(shortfall ?? 0, currency)}
      </td>
      <td className="px-5 py-3 text-right">
        <Link
          href={`/property/tenants/${row.tenant_id}`}
          className="inline-flex items-center gap-1 text-sm italic text-muted-foreground hover:text-foreground hover:underline"
        >
          View item
        </Link>
      </td>
    </tr>
  )
}

function TableSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-12 rounded-xl" />
      ))}
    </div>
  )
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
      <CalendarDaysIcon className="size-5 text-emerald-800" />
      {message}
    </div>
  )
}

function ErrorBlock({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-12 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button
        variant="outline"
        className="h-10 rounded-full px-5"
        onClick={onRetry}
      >
        Try again
      </Button>
    </div>
  )
}
