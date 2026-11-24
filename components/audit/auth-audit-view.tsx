"use client"

import { DownloadIcon } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthAudit } from "@/hooks/use-extras"
import { getErrorMessage } from "@/lib/api/errors"
import {
  exportAuthAudit,
  type AuthAuditFilters,
} from "@/lib/api/auth-audit"
import { saveBlob } from "@/lib/download"
import { formatDateTime } from "@/lib/format"

const PAGE_SIZE = 50

export function AuthAuditView() {
  const [username, setUsername] = useState("")
  const [action, setAction] = useState("")
  const [applied, setApplied] = useState<AuthAuditFilters>({})
  const [offset, setOffset] = useState(0)
  const query = useAuthAudit(PAGE_SIZE, offset, applied)
  const data = query.data
  const total = data?.total ?? 0

  function applyFilters() {
    setOffset(0)
    setApplied({
      username: username.trim() || undefined,
      action: action.trim() || undefined,
    })
  }

  function clearFilters() {
    setUsername("")
    setAction("")
    setOffset(0)
    setApplied({})
  }

  async function download() {
    try {
      const blob = await exportAuthAudit(applied)
      saveBlob(blob, "auth-audit-log.csv")
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't export the audit log."))
    }
  }

  const entries = data?.entries ?? []

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Sign-ins and accounts"
        title="Auth audit log"
        description="Login events and user-management changes."
        action={
          <Button
            variant="outline"
            className="h-10 self-start rounded-full px-5"
            onClick={download}
          >
            <DownloadIcon />
            Export CSV
          </Button>
        }
      />

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          applyFilters()
        }}
      >
        <div className="grid gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            Username
          </label>
          <Input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="e.g. admin"
            className="h-10 w-48 rounded-xl"
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            Action
          </label>
          <Input
            value={action}
            onChange={(event) => setAction(event.target.value)}
            placeholder="e.g. LOGIN"
            className="h-10 w-48 rounded-xl"
          />
        </div>
        <Button type="submit" className="h-10 rounded-full px-5">
          Apply
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-full px-5"
          onClick={clearFilters}
        >
          Clear
        </Button>
        <p className="ml-auto text-sm text-muted-foreground">
          {total} event{total === 1 ? "" : "s"}
        </p>
      </form>

      {query.isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(query.error, "Couldn't load the auth audit log.")}
        </p>
      ) : entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          No auth events match these filters.
        </p>
      ) : (
        <>
          <Card className="gap-0 rounded-2xl p-0">
            <ul className="divide-y">
              {entries.map((entry) => (
                <li key={entry.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{entry.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(entry.timestamp)}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {entry.username ?? "—"}
                    {entry.role ? ` (${entry.role})` : ""}
                    {entry.ip_address ? ` · ${entry.ip_address}` : ""}
                    {entry.entity_type ? ` · ${entry.entity_type}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {offset + 1}–{offset + entries.length} of {total}
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
                disabled={offset + PAGE_SIZE >= total || query.isFetching}
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
