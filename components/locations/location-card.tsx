import { MapPinIcon, UsersIcon } from "lucide-react"

import { LocationActions } from "@/components/locations/location-actions"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import type { StaffLocation } from "@/lib/types"

type LocationCardProps = {
  location: StaffLocation
  // Only admins get the edit / delete menu
  canManage: boolean
  onEdit: () => void
  onDelete: () => void
}

export function LocationCard({
  location,
  canManage,
  onEdit,
  onDelete,
}: LocationCardProps) {
  return (
    <Card className="flex-row items-center gap-4 rounded-2xl px-5 shadow-xs">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
        <MapPinIcon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 font-semibold break-words">
          {location.name}
          {!location.active && (
            <Badge className="bg-muted text-muted-foreground">Inactive</Badge>
          )}
        </p>
        {location.address && (
          <p className="text-xs break-words text-muted-foreground">
            {location.address}
          </p>
        )}
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <UsersIcon className="size-3.5" />
          {location.staff_count} staff{" "}
          {location.staff_count === 1 ? "member" : "members"}
        </p>
      </div>
      {canManage && (
        <LocationActions
          name={location.name}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </Card>
  )
}
