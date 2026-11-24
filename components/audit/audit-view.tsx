"use client"

import { ScrollTextIcon } from "lucide-react"
import { useState } from "react"

import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAudit } from "@/hooks/use-mnc"
import { getErrorMessage } from "@/lib/api/errors"
import { formatDateTime } from "@/lib/format"

const PAGE_SIZE = 50

export function AuditView() {
  const [offset, setOffset] = useState(0)
  const query = useAudit(PAGE_SIZE, offset)
  const rows = query.data ?? []

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
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          <ScrollTextIcon className="size-5 text-brand-ink" />
          No audit entries yet.
        </div>
      ) : (
        <>
          <Card className="gap-0 rounded-2xl p-0">
            <ul className="divide-y">
              {rows.map((entry) => (
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

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {offset + 1}–{offset + rows.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-9 rounded-full px-4"
                disabled={offset === 0 || query.isFetching}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                className="h-9 rounded-full px-4"
                disabled={rows.length < PAGE_SIZE || query.isFetching}
                onClick={() => setOffset(offset + PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
