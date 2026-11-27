"use client"

import { ScrollTextIcon, ShieldCheckIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAudit } from "@/hooks/use-mnc"
import { getErrorMessage } from "@/lib/api/errors"
import { formatDateTime } from "@/lib/format"
import type { AuditEntry } from "@/lib/types"

const PAGE_SIZE = 50

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "—"
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  return JSON.stringify(value)
}

function AuditValues({ entry }: { entry: AuditEntry }) {
  const before = entry.old_value ?? {}
  const after = entry.new_value ?? {}
  const keys = Array.from(
    new Set([...Object.keys(before), ...Object.keys(after)])
  ).filter((key) => {
    if (key in before && key in after) {
      return JSON.stringify(before[key]) !== JSON.stringify(after[key])
    }
    return true
  })
  if (keys.length === 0) return null

  return (
    <details className="mt-1.5 text-xs text-muted-foreground">
      <summary className="w-fit cursor-pointer select-none hover:text-foreground">
        Changed values
      </summary>
      <dl className="mt-2 grid gap-1">
        {keys.map((key) => (
          <div key={key} className="flex flex-wrap gap-x-2">
            <dt className="font-medium">{key.replaceAll("_", " ")}</dt>
            <dd>
              {key in before && key in after ? (
                <>
                  <span className="line-through opacity-70">
                    {formatValue(before[key])}
                  </span>
                  <span aria-hidden> → </span>
                  <span>{formatValue(after[key])}</span>
                </>
              ) : (
                formatValue(key in after ? after[key] : before[key])
              )}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  )
}

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
        action={
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-full px-4"
          >
            <Link href="/audit/auth">
              <ShieldCheckIcon />
              Auth audit
            </Link>
          </Button>
        }
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
                    {entry.user_role && entry.user_role !== entry.user_name
                      ? ` (${entry.user_role})`
                      : ""}
                    {entry.description ? ` — ${entry.description}` : ""}
                  </p>
                  <AuditValues entry={entry} />
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
