"use client"

import { MapPinIcon, PlusIcon } from "lucide-react"
import { useState } from "react"

import { PageHeader } from "@/components/dashboard/page-header"
import { LocationCard } from "@/components/locations/location-card"
import { LocationDialog } from "@/components/locations/location-dialog"
import { Button } from "@/components/ui/button"
import type { Location } from "@/lib/types"

export type LocationWithCount = Location & { staffCount: number }

// Adds and renames are kept in local state until there's a backend to save to
export function LocationsView({
  initialLocations,
}: {
  initialLocations: LocationWithCount[]
}) {
  const [locations, setLocations] = useState(initialLocations)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<LocationWithCount>()

  function openDialog(location?: LocationWithCount) {
    setEditing(location)
    setDialogOpen(true)
  }

  function save(name: string) {
    if (editing) {
      setLocations((prev) =>
        prev.map((l) => (l.id === editing.id ? { ...l, name } : l))
      )
    } else {
      const id = crypto.randomUUID()
      setLocations((prev) => [...prev, { id, name, staffCount: 0 }])
    }
    setDialogOpen(false)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Where your team works"
        title="Locations"
        description="Add work locations and keep their names consistent across records."
        action={
          <Button
            className="h-10 self-start rounded-full px-5"
            onClick={() => openDialog()}
          >
            <PlusIcon />
            Add Location
          </Button>
        }
      />

      {locations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          <MapPinIcon className="size-5 text-brand-ink" />
          No locations yet. Add one to start assigning staff.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {locations.map((location) => (
            <LocationCard
              key={location.id}
              name={location.name}
              staffCount={location.staffCount}
              onEdit={() => openDialog(location)}
            />
          ))}
        </div>
      )}

      <LocationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        location={editing}
        takenNames={locations
          .filter((l) => l.id !== editing?.id)
          .map((l) => l.name)}
        onSave={save}
      />
    </div>
  )
}
