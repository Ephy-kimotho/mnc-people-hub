import { HeartIcon } from "lucide-react"

import { Card } from "@/components/ui/card"
import { formatAmount } from "@/lib/format"
import type { StaffMember } from "@/lib/types"
import { cn } from "@/lib/utils"

export function LifeCoverCard({ staff }: { staff: StaffMember }) {
  const benefits = [
    { label: "Life Benefit", value: staff.life_benefit },
    { label: "Critical Illness", value: staff.critical_illness_benefit },
    {
      label: "Permanent & Total Disability",
      value: staff.disability_benefit,
    },
    { label: "Funeral Benefit", value: staff.funeral_benefit },
    { label: "Annual Premium", value: staff.life_premium },
  ]
  const hasCover =
    staff.life_cover_provider || benefits.some((b) => b.value !== null)

  return (
    <Card className="gap-0 rounded-2xl py-0 shadow-xs">
      <div className="flex items-center gap-4 border-b px-6 py-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-ink">
          <HeartIcon className="size-4" />
        </span>
        <div>
          <h2 className="font-heading text-base font-semibold">Life Cover</h2>
          <p className="text-xs text-muted-foreground">
            Insurance benefit summary (KES)
          </p>
        </div>
      </div>

      {!hasCover ? (
        <p className="px-6 py-8 text-center text-sm text-muted-foreground">
          No life cover on record.
        </p>
      ) : (
        <>
          <dl className="grid gap-4 px-6 py-5 sm:grid-cols-2">
            <Item label="Provider" value={staff.life_cover_provider} />
            <Item label="Policy No." value={staff.policy_number} mono />
          </dl>

          <p className="border-y bg-muted/50 px-6 py-3 text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            Beneficiary
          </p>
          <dl className="grid gap-4 px-6 py-5 sm:grid-cols-2">
            <Item label="Name" value={staff.beneficiary} />
            <Item label="ID No." value={staff.beneficiary_id} mono />
          </dl>

          {/* Benefit columns wrap into a grid on narrow cards */}
          <dl className="grid grid-cols-2 border-t sm:grid-cols-3 xl:grid-cols-5">
            {benefits.map(({ label, value }, index) => (
              <div key={label} className="flex flex-col">
                <dt className="flex-1 bg-muted/50 px-4 py-3 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
                  {label}
                </dt>
                <dd
                  className={cn(
                    "px-4 py-4 font-mono text-sm",
                    index === benefits.length - 1 &&
                      "font-semibold text-brand-ink"
                  )}
                >
                  {value === null ? "—" : formatAmount(value)}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </Card>
  )
}

function Item({
  label,
  value,
  mono,
}: {
  label: string
  value: string | null
  mono?: boolean
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className={cn("text-sm", mono && "font-mono")}>{value || "—"}</dd>
    </div>
  )
}
