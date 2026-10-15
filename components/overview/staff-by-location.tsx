"use client"

import { MapPinIcon } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useLocations } from "@/hooks/use-locations"
import { getErrorMessage } from "@/lib/api/errors"
import { canAccessPage, canSeeTeamOverview } from "@/lib/permissions"
import { useAuth } from "@/providers/auth-provider"

// Shares the locations page's cached query, so names and counts always match
// Team head counts, so staff don't get it (or fetch its data)
export function StaffByLocation() {
  const { user } = useAuth()
  return canSeeTeamOverview(user) ? <StaffByLocationCards /> : null
}

function StaffByLocationCards() {
  const query = useLocations()
  const { user } = useAuth()

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 font-heading font-semibold">
        <MapPinIcon className="size-4 text-brand-ink" />
        Staff by location
      </h2>
      {query.isPending ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }, (_, i) => (
            <Card
              key={i}
              className="flex-row items-center gap-4 rounded-2xl px-5 shadow-xs"
            >
              <Skeleton className="size-10 rounded-xl" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-8 w-10" />
            </Card>
          ))}
        </div>
      ) : query.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(query.error, "Couldn't load locations.")}
          </p>
          <Button
            variant="outline"
            className="h-10 rounded-full px-5"
            onClick={() => query.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : query.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-10 text-center text-sm text-muted-foreground">
          No locations yet.
          {canAccessPage(user, "/locations") && (
            <Link
              href="/locations"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Add one on the Locations page
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {query.data.map((location) => (
            <Card
              key={location.location_id}
              className="flex-row items-center gap-4 rounded-2xl px-5 shadow-xs"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
                <MapPinIcon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium wrap-break-word">
                  {location.name}
                  {!location.active && (
                    <Badge className="bg-muted text-muted-foreground">
                      Inactive
                    </Badge>
                  )}
                </p>
                {location.address && (
                  <p className="text-xs wrap-break-word text-muted-foreground">
                    {location.address}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-heading text-2xl leading-none font-bold">
                  {location.staff_count}
                </p>
                <p className="text-xs text-muted-foreground">staff</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
