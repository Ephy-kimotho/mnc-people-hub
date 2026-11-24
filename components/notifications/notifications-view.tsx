"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { BellIcon, Loader2Icon, RefreshCwIcon } from "lucide-react"
import toast from "react-hot-toast"

import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useNotificationHistory,
  useNotificationStats,
} from "@/hooks/use-extras"
import { getErrorMessage } from "@/lib/api/errors"
import {
  notificationKeys,
  retryNotification,
} from "@/lib/api/notifications"
import { formatDateTime } from "@/lib/format"

export function NotificationsView() {
  const queryClient = useQueryClient()
  const stats = useNotificationStats()
  const history = useNotificationHistory()

  const retry = useMutation({
    mutationFn: (id: string) => retryNotification(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      toast.success("Notification retried")
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't retry the notification.")),
  })

  const cards = [
    { label: "Total", value: stats.data?.total },
    { label: "Sent", value: stats.data?.sent },
    { label: "Failed", value: stats.data?.failed },
    { label: "Pending", value: stats.data?.pending },
    { label: "Delivery rate", value: stats.data ? `${stats.data.delivery_rate}%` : undefined },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Outbox"
        title="Notifications"
        description="Every email the system has tried to send."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.label} className="rounded-2xl px-5 py-5 shadow-xs">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {card.label}
            </p>
            <p className="mt-1 font-heading text-2xl font-bold">
              {card.value ?? "—"}
            </p>
          </Card>
        ))}
      </div>

      {history.isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : history.isError ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(history.error, "Couldn't load notifications.")}
        </p>
      ) : (history.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          <BellIcon className="size-5 text-brand-ink" />
          Nothing sent yet.
        </div>
      ) : (
        <Card className="gap-0 rounded-2xl p-0">
          <ul className="divide-y">
            {(history.data ?? []).map((item) => (
              <li
                key={item.notification_id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {item.subject ?? item.type}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {item.staff_name ?? item.recipient_email ?? "—"} ·{" "}
                    {formatDateTime(item.created_at)}
                  </p>
                  {item.error_message ? (
                    <p className="text-xs text-destructive">
                      {item.error_message}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      item.status === "sent"
                        ? "secondary"
                        : item.status === "failed"
                          ? "destructive"
                          : "outline"
                    }
                  >
                    {item.status}
                  </Badge>
                  {item.status === "failed" || item.status === "pending" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      disabled={retry.isPending}
                      onClick={() => retry.mutate(item.notification_id)}
                    >
                      {retry.isPending ? (
                        <Loader2Icon className="animate-spin" />
                      ) : (
                        <RefreshCwIcon />
                      )}
                      Retry
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
