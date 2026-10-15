import type { LucideIcon } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type StatCardProps = {
  icon: LucideIcon
  label: string
  // Undefined once loading has finished means the figure couldn't load
  value?: number
  caption: string
  loading?: boolean
}

export function StatCard({
  icon: Icon,
  label,
  value,
  caption,
  loading = false,
}: StatCardProps) {
  return (
    <Card className="gap-0 rounded-2xl px-5 py-5 shadow-xs">
      <span className="mb-5 flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
        <Icon className="size-4" />
      </span>
      <p className="text-[0.7rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      {loading ? (
        <Skeleton className="mt-1 h-10 w-14" />
      ) : (
        <p className="mt-1 font-heading text-4xl font-bold">{value ?? "–"}</p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
    </Card>
  )
}
