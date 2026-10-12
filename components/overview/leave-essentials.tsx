import { ArrowRightIcon, CalendarDaysIcon } from "lucide-react"
import Link from "next/link"

import { Eyebrow } from "@/components/dashboard/eyebrow"
import { Button } from "@/components/ui/button"

const links = [
  { label: "Review requests", href: "/leaves" },
  { label: "Open directory", href: "/staff" },
]

export function LeaveEssentials() {
  return (
    <aside className="flex flex-col rounded-2xl border border-brand/30 bg-brand-soft p-6">
      <span className="mb-8 flex size-10 items-center justify-center rounded-full bg-brand text-brand-foreground">
        <CalendarDaysIcon className="size-4" />
      </span>
      <Eyebrow>Leave essentials</Eyebrow>
      <h2 className="mt-2 font-heading text-xl font-semibold">
        Stay ahead of time away.
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Keep requests and balances together. Kenyan employment law provides 21
        working days of annual leave with full pay.
      </p>

      <div className="mt-8 space-y-3 lg:mt-auto lg:pt-8">
        {links.map((link) => (
          <Button
            key={link.href}
            asChild
            variant="outline"
            className="h-11 w-full justify-between rounded-full bg-card px-4"
          >
            <Link href={link.href}>
              {link.label}
              <ArrowRightIcon />
            </Link>
          </Button>
        ))}
      </div>
    </aside>
  )
}
