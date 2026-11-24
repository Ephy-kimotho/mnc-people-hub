"use client"

import { AwardIcon, CakeIcon } from "lucide-react"

import { Card } from "@/components/ui/card"
import { useAnniversaries, useBirthdays } from "@/hooks/use-mnc"
import { canReviewLeave } from "@/lib/permissions"
import { useAuth } from "@/providers/auth-provider"

/** Birthdays and work anniversaries coming up in the next 30 days. */
export function Milestones() {
  const { user } = useAuth()
  const enabled = canReviewLeave(user)
  const birthdays = useBirthdays(enabled)
  const anniversaries = useAnniversaries(enabled)

  if (!enabled) return null

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="gap-3 rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <CakeIcon className="size-4 text-brand-ink" />
          <h2 className="font-heading text-lg font-semibold">Birthdays</h2>
        </div>
        {birthdays.isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (birthdays.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            None in the next 30 days.
          </p>
        ) : (
          <ul className="divide-y text-sm">
            {(birthdays.data ?? []).map((item) => (
              <li
                key={item.staff_id}
                className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
              >
                <span className="font-medium">{item.full_name}</span>
                <span className="text-muted-foreground">
                  {item.birthday_display}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="gap-3 rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <AwardIcon className="size-4 text-brand-ink" />
          <h2 className="font-heading text-lg font-semibold">Anniversaries</h2>
        </div>
        {anniversaries.isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (anniversaries.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            None in the next 30 days.
          </p>
        ) : (
          <ul className="divide-y text-sm">
            {(anniversaries.data ?? []).map((item) => (
              <li
                key={item.staff_id}
                className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
              >
                <span className="font-medium">{item.full_name}</span>
                <span className="text-muted-foreground">
                  {item.years_completed} yr
                  {item.years_completed === 1 ? "" : "s"} ·{" "}
                  {item.anniversary_display}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
