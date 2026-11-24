"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckIcon, Loader2Icon, PlusIcon, WrenchIcon } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { MaintenanceDialog } from "@/components/property/maintenance-dialog"
import {
  useMaintenance,
  useMaintenanceSummary,
  useProperties,
} from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import {
  deleteMaintenance,
  propertyKeys,
  resolveMaintenance,
} from "@/lib/api/properties"
import { canManageProperty } from "@/lib/permissions"
import type { Maintenance } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

const priorityTone: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-brand-soft text-brand-ink",
  high: "bg-warning/15 text-warning",
  urgent: "bg-destructive/10 text-destructive",
}

export function OperationsView() {
  const { user } = useAuth()
  const canManage = canManageProperty(user)
  const query = useMaintenance({})
  const summary = useMaintenanceSummary()
  const properties = useProperties()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState<Maintenance>()

  const propertyName = (id: string) =>
    (properties.data ?? []).find((property) => property.property_id === id)
      ?.alias ?? "Property"

  const resolve = useMutation({
    mutationFn: (id: string) => resolveMaintenance(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Marked as resolved")
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't resolve it.")),
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteMaintenance(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Maintenance record deleted")
      setDeleting(undefined)
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't delete it.")),
  })

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Maintenance desk"
        title="Operations"
        description="Repairs, maintenance jobs and tenant complaints."
        action={
          canManage && (
            <Button
              className="h-10 self-start rounded-full px-5"
              onClick={() => setOpen(true)}
            >
              <PlusIcon />
              Log request
            </Button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total", value: summary.data?.total },
          { label: "Open", value: summary.data?.open },
          { label: "Urgent open", value: summary.data?.urgent_open },
        ].map((item) => (
          <Card key={item.label} className="rounded-2xl px-5 py-5 shadow-xs">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {item.label}
            </p>
            <p className="mt-1 font-heading text-2xl font-bold">
              {item.value ?? "—"}
            </p>
          </Card>
        ))}
      </div>

      {query.isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(query.error, "Couldn't load maintenance.")}
          </p>
          <Button
            variant="outline"
            className="h-10 rounded-full px-5"
            onClick={() => query.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : (query.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          <WrenchIcon className="size-5 text-brand-ink" />
          Nothing open on the portfolio.
        </div>
      ) : (
        <Card className="gap-0 rounded-2xl p-0">
          <ul className="divide-y">
            {(query.data ?? []).map((item) => (
              <li
                key={item.maintenance_id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {propertyName(item.property_id)} · {item.kind}
                    {item.category ? ` · ${item.category}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${priorityTone[item.priority] ?? "bg-muted"}`}
                  >
                    {item.priority}
                  </span>
                  <Badge
                    variant={item.status === "Resolved" ? "secondary" : "outline"}
                  >
                    {item.status}
                  </Badge>
                  {canManage && item.status !== "Resolved" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      disabled={resolve.isPending}
                      onClick={() => resolve.mutate(item.maintenance_id)}
                    >
                      {resolve.isPending ? (
                        <Loader2Icon className="animate-spin" />
                      ) : (
                        <CheckIcon />
                      )}
                      Resolve
                    </Button>
                  ) : null}
                  {canManage ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-destructive"
                      onClick={() => setDeleting(item)}
                    >
                      Delete
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <MaintenanceDialog open={open} onOpenChange={setOpen} />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(undefined)}
      >
        <AlertDialogContent className="rounded-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              Delete {deleting?.title}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the maintenance record. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="-mx-6 -mb-6 px-6">
            <AlertDialogCancel className="h-10 rounded-xl px-5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                if (deleting) remove.mutate(deleting.maintenance_id)
              }}
              disabled={remove.isPending}
              variant="destructive"
              className="h-10 rounded-xl px-5"
            >
              {remove.isPending && <Loader2Icon className="animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
