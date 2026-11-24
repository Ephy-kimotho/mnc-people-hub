"use client"

import { ScrollTextIcon } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAudit } from "@/hooks/use-mnc"
import { getErrorMessage } from "@/lib/api/errors"
import { formatDateTime } from "@/lib/format"

export function AuditView() {
  const query = useAudit()

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Accountability"
        title="Audit log"
        description="Who changed what in MNC People."
      />

      {query.isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(query.error, "Couldn't load the audit log.")}
        </p>
      ) : (query.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          <ScrollTextIcon className="size-5 text-brand-ink" />
          No audit entries yet.
        </div>
      ) : (
        <Card className="gap-0 rounded-2xl p-0">
          <ul className="divide-y">
            {(query.data ?? []).map((entry) => (
              <li key={entry.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {entry.action}
                    {entry.entity ? ` · ${entry.entity}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(entry.created_at)}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {entry.user_name ?? "System"}
                  {entry.user_role ? ` (${entry.user_role})` : ""}
                  {entry.description ? ` — ${entry.description}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
