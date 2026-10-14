import { getYear } from "date-fns"

import { Card } from "@/components/ui/card"
import { ANNUAL_LEAVE_DAYS } from "@/lib/leave"
import { cn } from "@/lib/utils"

type Balance = {
  label: string
  entitlement: number
  used: number
  pending: number
}

// Placeholder figures until GET /staff/{id}/leave-balance is wired up
const balances: Balance[] = [
  {
    label: "Annual Leave",
    entitlement: ANNUAL_LEAVE_DAYS,
    used: 0,
    pending: 0,
  },
  { label: "Sick Leave", entitlement: 7, used: 0, pending: 0 },
]

export function LeaveBalance() {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">
        Leave Balance {getYear(new Date())}
      </h2>
      {balances.map((balance) => {
        const stats = [
          {
            label: "Entitlement",
            value: balance.entitlement,
            caption: "Total days",
          },
          { label: "Used", value: balance.used, caption: "Taken so far" },
          {
            label: "Pending",
            value: balance.pending,
            caption: "Awaiting approval",
          },
          {
            label: "Remaining",
            value: balance.entitlement - balance.used - balance.pending,
            caption: "Available to take",
          },
        ]

        return (
          <div key={balance.label} className="space-y-2.5">
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
              {balance.label}
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
                      stat.label !== "Remaining" && "text-muted-foreground"
                    )}
                  >
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.caption}
                  </p>
                </div>
              ))}
            </Card>
          </div>
        )
      })}
    </section>
  )
}
