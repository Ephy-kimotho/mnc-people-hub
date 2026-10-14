import type { LucideIcon } from "lucide-react"

import { Card } from "@/components/ui/card"

type DetailsCardProps = {
  icon: LucideIcon
  title: string
  // Shown at the right of the title, e.g. an "Add" button
  action?: React.ReactNode
  children: React.ReactNode
}

export function DetailsCard({
  icon: Icon,
  title,
  action,
  children,
}: DetailsCardProps) {
  return (
    <Card className="gap-0 rounded-2xl px-6 py-6 shadow-xs">
      <div className="mb-4 flex min-h-8 items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-heading text-sm font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          <Icon className="size-4" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </Card>
  )
}

// Label/value pairs on one line each; missing values read "n/a"
export function DetailsList({
  rows,
}: {
  rows: { label: string; value: string | null }[]
}) {
  return (
    <dl className="space-y-3.5">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex items-baseline justify-between gap-4">
          <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
          <dd className="min-w-0 text-right text-sm font-medium break-all">
            {value || "n/a"}
          </dd>
        </div>
      ))}
    </dl>
  )
}
