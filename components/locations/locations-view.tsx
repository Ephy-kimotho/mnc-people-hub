"use client"

import { MapPinIcon, PlusIcon } from "lucide-react"
import { useState } from "react"

import { PageHeader } from "@/components/dashboard/page-header"
import { DeleteLocationDialog } from "@/components/locations/delete-location-dialog"
import { LocationCard } from "@/components/locations/location-card"
import { LocationDialog } from "@/components/locations/location-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useLocations } from "@/hooks/use-locations"
import { getErrorMessage } from "@/lib/api/errors"
import type { StaffLocation } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

export function LocationsView() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const [openDialog, setOpenDialog] = useState<"form" | "delete" | null>(null)
  const [selected, setSelected] = useState<StaffLocation>()

  const locationsQuery = useLocations()
  const locations = locationsQuery.data ?? []

  function open(kind: "form" | "delete", location?: StaffLocation) {
    setSelected(location)
    setOpenDialog(kind)
  }

  function closeDialog(isOpen: boolean) {
    if (!isOpen) setOpenDialog(null)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Where your team works"
        title="Locations"
        description="Add work locations and keep their names consistent across records."
        action={
          isAdmin && (
            <Button
              className="h-10 self-start rounded-full px-5"
              onClick={() => open("form")}
            >
              <PlusIcon />
              Add Location
            </Button>
          )
        }
      />

      {locationsQuery.isPending ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Card
              key={i}
              className="flex-row items-center gap-4 rounded-2xl px-5 shadow-xs"
            >
              <Skeleton className="size-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </Card>
          ))}
        </div>
      ) : locationsQuery.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(locationsQuery.error, "Couldn't load locations.")}
          </p>
          <Button
            variant="outline"
            className="h-10 rounded-full px-5"
            onClick={() => locationsQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : locations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          <MapPinIcon className="size-5 text-brand-ink" />
          No locations yet. Add one to start assigning staff.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {locations.map((location) => (
            <LocationCard
              key={location.location_id}
              location={location}
              canManage={isAdmin}
              onEdit={() => open("form", location)}
              onDelete={() => open("delete", location)}
            />
          ))}
        </div>
      )}

      <LocationDialog
        open={openDialog === "form"}
        onOpenChange={closeDialog}
        location={selected}
        takenNames={locations
          .filter((l) => l.location_id !== selected?.location_id)
          .map((l) => l.name)}
      />
      <DeleteLocationDialog
        open={openDialog === "delete"}
        onOpenChange={closeDialog}
        location={selected}
      />
    </div>
  )
}
