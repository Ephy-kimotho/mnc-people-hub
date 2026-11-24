"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowUpRightIcon,
  CheckIcon,
  Loader2Icon,
  ShieldAlertIcon,
  TriangleAlertIcon,
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useNeedsAttention } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import { acknowledgeAlert, propertyKeys } from "@/lib/api/properties"
import { canManageProperty } from "@/lib/permissions"
import type { NeedsAttentionAlert } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

const kindTone: Record<string, string> = {
  Deposit:
    "border-amber-600/30 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  Lease: "border-sky-600/30 bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
  Rent: "border-border bg-muted text-muted-foreground",
}

export function NeedsAttentionView() {
  const { user } = useAuth()
  const canManage = canManageProperty(user)
  const query = useNeedsAttention()
  const queryClient = useQueryClient()

  const acknowledge = useMutation({
    mutationFn: (alertKey: string) => acknowledgeAlert(alertKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Alert acknowledged")
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't acknowledge the alert.")),
  })

  const alerts = query.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Portfolio health"
        title="Needs Attention"
        description="Live issues from active leases. Marking done acknowledges an alert; update the tenant or lease to resolve it."
      />

      <h2 className="font-heading text-lg font-semibold">
        To do{" "}
        <span className="text-muted-foreground">
          ({query.isPending ? "…" : alerts.length})
        </span>
      </h2>

      {query.isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(query.error, "Couldn't load alerts.")}
          </p>
          <Button
            variant="outline"
            className="h-10 rounded-full px-5"
            onClick={() => query.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          <CheckIcon className="size-5 text-emerald-800" />
          Nothing needs attention right now.
        </div>
      ) : (
        <ul className="grid gap-3">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.alert_key}
              alert={alert}
              canManage={canManage}
              pending={acknowledge.isPending}
              onAcknowledge={() => acknowledge.mutate(alert.alert_key)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function AlertCard({
  alert,
  canManage,
  pending,
  onAcknowledge,
}: {
  alert: NeedsAttentionAlert
  canManage: boolean
  pending: boolean
  onAcknowledge: () => void
}) {
  const critical = alert.severity === "critical"
  const Icon = critical ? ShieldAlertIcon : TriangleAlertIcon

  return (
    <li>
      <Card className="flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5 shadow-xs">
        <div className="flex min-w-0 items-start gap-4">
          <span
            className={
              critical
                ? "flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                : "flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600"
            }
          >
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{alert.title}</p>
              <Badge
                variant="outline"
                className={`rounded-full ${kindTone[alert.kind] ?? ""}`}
              >
                {alert.kind}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{alert.detail}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-full px-4"
          >
            <Link href={`/property/tenants/${alert.tenant_id}`}>
              View item
              <ArrowUpRightIcon />
            </Link>
          </Button>
          {canManage ? (
            <Button
              className="h-10 rounded-full bg-emerald-800 px-5 text-white hover:bg-emerald-900"
              disabled={pending}
              onClick={onAcknowledge}
            >
              {pending && <Loader2Icon className="animate-spin" />}
              Mark done
            </Button>
          ) : null}
        </div>
      </Card>
    </li>
  )
}
