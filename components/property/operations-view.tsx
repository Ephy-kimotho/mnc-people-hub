"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import {
  Loader2Icon,
  PaperclipIcon,
  PlusIcon,
  SearchIcon,
  WrenchIcon,
} from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { MaintenanceDetailDialog } from "@/components/property/maintenance-detail-dialog"
import { MaintenanceDialog } from "@/components/property/maintenance-dialog"
import { useMaintenance } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import {
  propertyKeys,
  resolveMaintenance,
} from "@/lib/api/properties"
import { canManageProperty } from "@/lib/permissions"
import type { Maintenance } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

const statusTone: Record<string, string> = {
  Open:
    "border-emerald-700/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  InProgress:
    "border-amber-600/30 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  Resolved: "border-border bg-muted text-muted-foreground",
  Closed: "border-border bg-muted text-muted-foreground",
  Cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
}

export function OperationsView() {
  const { user } = useAuth()
  const canManage = canManageProperty(user)
  const query = useMaintenance({})
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [viewing, setViewing] = useState<Maintenance>()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")

  const resolve = useMutation({
    mutationFn: (id: string) => resolveMaintenance(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Marked as resolved")
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't resolve it.")),
  })

  const records = query.data ?? []
  const categories = Array.from(
    new Set(records.map((record) => record.category).filter(Boolean))
  ) as string[]
  const term = search.trim().toLowerCase()
  const filtered = records.filter((record) => {
    const matchesCategory =
      category === "all" || record.category === category
    const matchesSearch =
      !term ||
      [record.title, record.description, record.category, record.contractor]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Maintenance desk"
        title="Operations"
        description="Maintenance, repairs, and complaints log."
        action={
          canManage && (
            <Button
              className="h-10 self-start rounded-full bg-emerald-800 px-5 text-white hover:bg-emerald-900"
              onClick={() => setOpen(true)}
            >
              <PlusIcon />
              New Record
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search records…"
            className="h-11 rounded-full pl-9"
          />
        </div>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="h-11 rounded-full border bg-background px-3.5 text-sm"
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {query.isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(query.error, "Couldn't load operations.")}
          </p>
          <Button
            variant="outline"
            className="h-10 rounded-full px-5"
            onClick={() => query.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          <WrenchIcon className="size-5 text-emerald-800" />
          {records.length === 0
            ? "Nothing logged on the portfolio yet."
            : "No records match these filters."}
        </div>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((record) => (
            <OperationCard
              key={record.maintenance_id}
              record={record}
              canManage={canManage}
              pending={resolve.isPending}
              onView={() => setViewing(record)}
              onResolve={() => resolve.mutate(record.maintenance_id)}
            />
          ))}
        </ul>
      )}

      <MaintenanceDialog open={open} onOpenChange={setOpen} />
      <MaintenanceDetailDialog
        open={Boolean(viewing)}
        onOpenChange={(next) => !next && setViewing(undefined)}
        record={viewing}
      />
    </div>
  )
}

function OperationCard({
  record,
  canManage,
  pending,
  onView,
  onResolve,
}: {
  record: Maintenance
  canManage: boolean
  pending: boolean
  onView: () => void
  onResolve: () => void
}) {
  const attachment = record.photo_urls?.[0]?.split("/").pop()
  const status = record.status === "InProgress" ? "In Progress" : record.status

  return (
    <li>
      <Card className="flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5 shadow-xs">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge
              variant="outline"
              className={`rounded-full ${statusTone[record.status] ?? ""}`}
            >
              {status}
            </Badge>
            {record.category ? <span>{record.category}</span> : null}
            <span>•</span>
            <span>
              {record.raised_at
                ? format(new Date(record.raised_at), "d MMM yyyy")
                : record.created_at
                  ? format(new Date(record.created_at), "d MMM yyyy")
                  : ""}
            </span>
          </div>
          <p className="mt-2 font-heading text-lg font-semibold">
            {record.title}
          </p>
          {attachment || record.description ? (
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <PaperclipIcon className="size-3.5 shrink-0" />
              <span className="truncate">
                {attachment || record.description}
              </span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="h-9 rounded-full px-4"
            onClick={onView}
          >
            View Details
          </Button>
          {canManage && record.status !== "Resolved" ? (
            <Button
              className="h-9 rounded-full bg-emerald-800 px-4 text-white hover:bg-emerald-900"
              disabled={pending}
              onClick={onResolve}
            >
              {pending && <Loader2Icon className="animate-spin" />}
              Mark Resolved
            </Button>
          ) : null}
        </div>
      </Card>
    </li>
  )
}
