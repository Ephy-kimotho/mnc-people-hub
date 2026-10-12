import { initials } from "@/lib/staff"
import { cn } from "@/lib/utils"

export function StaffAvatar({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft font-heading font-semibold text-brand-ink",
        className
      )}
    >
      {initials(name)}
    </span>
  )
}

// Each location gets a stable tint based on its position in the list
const tones = [
  "bg-brand-soft text-brand-ink",
  "bg-success-soft text-success",
  "bg-muted text-muted-foreground",
]

export function LocationPill({ name, index }: { name: string; index: number }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[index % tones.length]
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" />
      {name}
    </span>
  )
}
