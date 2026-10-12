import { MapPinIcon } from "lucide-react"

import { Card } from "@/components/ui/card"

type LocationCount = { id: string; name: string; count: number }

export function StaffByLocation({ items }: { items: LocationCount[] }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 font-heading font-semibold">
        <MapPinIcon className="size-4 text-brand-ink" />
        Staff by location
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <Card
            key={item.id}
            className="flex-row items-center gap-4 rounded-2xl px-5 shadow-xs"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
              <MapPinIcon className="size-4" />
            </span>
            <p className="flex-1 font-medium">{item.name}</p>
            <div className="text-right">
              <p className="font-heading text-2xl leading-none font-bold">
                {item.count}
              </p>
              <p className="text-xs text-muted-foreground">staff</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
