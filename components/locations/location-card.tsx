import { MapPinIcon, PencilIcon, UsersIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type LocationCardProps = {
  name: string
  staffCount: number
  onEdit: () => void
}

export function LocationCard({ name, staffCount, onEdit }: LocationCardProps) {
  return (
    <Card className="flex-row items-center gap-4 rounded-2xl px-5 shadow-xs">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
        <MapPinIcon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold break-words">{name}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <UsersIcon className="size-3.5" />
          {staffCount} staff {staffCount === 1 ? "member" : "members"}
        </p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="rounded-full px-3"
        onClick={onEdit}
      >
        <PencilIcon />
        Edit name
      </Button>
    </Card>
  )
}
