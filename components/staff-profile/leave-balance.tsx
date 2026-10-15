"use client"

import { useQuery } from "@tanstack/react-query"
import { getYear } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getErrorMessage } from "@/lib/api/errors"
import { fetchLeaveBalances, leaveKeys } from "@/lib/api/leaves"
import { ANNUAL_LEAVE_DAYS, leaveTypeLabels } from "@/lib/leave"
import type { LeaveBalanceRecord, LeaveType } from "@/lib/types"
import { cn } from "@/lib/utils"

type Balance = {
  type: LeaveType
  entitlement: number
  approved: number
  pending: number
  remaining: number
}

// Shown untouched when the API has no row for a type, since a missing row
// means none of that leave has been used this year
const defaultEntitlements: Partial<Record<LeaveType, number>> = {
  annual: ANNUAL_LEAVE_DAYS,
  sick: 7,
}

// Defaults first, replaced by any matching row from the API, then any other
// types the API returns
function toBalances(records: LeaveBalanceRecord[], year: number) {
  const balances = new Map<LeaveType, Balance>()
  for (const [type, days] of Object.entries(defaultEntitlements)) {
    balances.set(type as LeaveType, {
      type: type as LeaveType,
      entitlement: days,
      approved: 0,
      pending: 0,
      remaining: days,
    })
  }
  for (const record of records.filter((r) => r.year === year)) {
    const type = record.leave_type.toLowerCase() as LeaveType
    balances.set(type, {
      type,
      entitlement: record.entitlement_days,
      approved: record.days_approved,
      pending: record.days_pending,
      remaining: record.days_remaining,
    })
  }
  return [...balances.values()]
}

export function LeaveBalance({ staffId }: { staffId: string }) {
  const year = getYear(new Date())
  const query = useQuery({
    queryKey: leaveKeys.balances(staffId),
    queryFn: () => fetchLeaveBalances(staffId),
  })

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">
        Leave Balance {year}
      </h2>
      {query.isPending ? (
        Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="space-y-2.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        ))
      ) : query.isError ? (
        <Card className="items-center gap-3 rounded-2xl px-6 py-10 text-center shadow-xs">
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(query.error, "Couldn't load leave balances.")}
          </p>
          <Button
            variant="outline"
            className="h-10 rounded-full px-5"
            onClick={() => query.refetch()}
          >
            Try again
          </Button>
        </Card>
      ) : (
        toBalances(query.data, year).map((balance) => (
          <BalanceCard key={balance.type} balance={balance} />
        ))
      )}
    </section>
  )
}

function BalanceCard({ balance }: { balance: Balance }) {
  const stats = [
    {
      label: "Entitlement",
      value: balance.entitlement,
      caption: "Total days",
      tone: "font-bold text-foreground",
    },
    {
      label: "Approved",
      value: balance.approved,
      caption: "Approved this year",
      tone: "text-success",
    },
    {
      label: "Pending",
      value: balance.pending,
      caption: "Awaiting approval",
      tone: "text-warning",
    },
    {
      label: "Remaining",
      value: balance.remaining,
      caption: "Available to take",
      tone: "text-foreground",
    },
  ]

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
        {leaveTypeLabels[balance.type] ?? balance.type} Leave
      </p>
      {/* Four stats in one card; dividers follow the 2x2 / 1x4 layout */}
      <Card className="grid grid-cols-2 gap-0 rounded-2xl py-0 shadow-xs xl:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={cn(
              "px-5 py-4",
              index % 2 === 1 && "border-l",
              index >= 2 && "border-t xl:border-t-0",
              index === 2 && "xl:border-l"
            )}
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p
              className={cn(
                "mt-1 font-heading text-3xl font-semibold",
                stat.tone
              )}
            >
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.caption}</p>
          </div>
        ))}
      </Card>
    </div>
  )
}
