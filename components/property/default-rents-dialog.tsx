"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useAllUnits } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import { propertyKeys, updateUnit } from "@/lib/api/properties"
import type { PropertyUnit } from "@/lib/types"

const inputClass =
  "h-10 w-32 rounded-xl border bg-background px-3 text-sm tabular-nums"

export function DefaultRentsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const query = useAllUnits()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Edit unit default rents
          </DialogTitle>
          <DialogDescription>
            Set the default monthly rent for each unit. Defaults pre-fill new
            leases.
          </DialogDescription>
        </DialogHeader>

        {query.isPending ? (
          <div className="grid gap-3 px-6 py-5">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : query.isError ? (
          <p className="px-6 py-8 text-sm text-destructive">
            {getErrorMessage(query.error, "Couldn't load the units.")}
          </p>
        ) : (query.data ?? []).length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">
            No units yet. Add units from a property first.
          </p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            <GroupedRents units={query.data ?? []} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function GroupedRents({ units }: { units: PropertyUnit[] }) {
  const groups = new Map<string, PropertyUnit[]>()
  for (const unit of units) {
    const key = unit.property_alias ?? "Property"
    const list = groups.get(key) ?? []
    list.push(unit)
    groups.set(key, list)
  }

  return (
    <div className="px-6 py-5">
      {Array.from(groups.entries()).map(([alias, list]) => (
        <div key={alias} className="mb-6 last:mb-0">
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {alias}
          </p>
          <div className="divide-y rounded-xl border">
            {list.map((unit) => (
              <UnitRentRow key={unit.unit_id} unit={unit} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function UnitRentRow({ unit }: { unit: PropertyUnit }) {
  const queryClient = useQueryClient()
  const [kes, setKes] = useState(() =>
    unit.default_rent_kes != null ? String(unit.default_rent_kes) : ""
  )
  const [usd, setUsd] = useState(() =>
    unit.default_rent_usd != null ? String(unit.default_rent_usd) : ""
  )

  const mutation = useMutation({
    mutationFn: () =>
      updateUnit(unit.unit_id, {
        default_rent_kes: kes === "" ? undefined : Number(kes),
        default_rent_usd: usd === "" ? undefined : Number(usd),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success(`${unit.label} default rent saved`)
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't save the default rent.")),
  })

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{unit.label}</p>
        <p className="text-xs text-muted-foreground">
          {unit.bedrooms != null ? `${unit.bedrooms} bd · ` : ""}
          {unit.status === "UnderMaintenance"
            ? "Under maintenance"
            : unit.status}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">KES</span>
          <input
            type="number"
            min="0"
            value={kes}
            onChange={(event) => setKes(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">USD</span>
          <input
            type="number"
            min="0"
            value={usd}
            onChange={(event) => setUsd(event.target.value)}
            className={inputClass}
          />
        </label>
        <Button
          size="sm"
          className="h-10 rounded-xl px-4"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending && <Loader2Icon className="animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  )
}
