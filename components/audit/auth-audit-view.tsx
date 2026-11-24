"use client"

import { DownloadIcon } from "lucide-react"
import toast from "react-hot-toast"

import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthAudit } from "@/hooks/use-extras"
import { getErrorMessage } from "@/lib/api/errors"
import { exportAuthAudit } from "@/lib/api/auth-audit"
import { saveBlob } from "@/lib/download"
import { formatDateTime } from "@/lib/format"

export function AuthAuditView() {
  const query = useAuthAudit()

  async function download() {
    try {
      const blob = await exportAuthAudit()
      saveBlob(blob, "auth-audit-log.csv")
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't export the audit log."))
    }
  }

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
      ) : (query.data?.entries ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          No auth events yet.
        </p>
      ) : (
        <Card className="gap-0 rounded-2xl p-0">
          <ul className="divide-y">
            {(query.data?.entries ?? []).map((entry) => (
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
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
