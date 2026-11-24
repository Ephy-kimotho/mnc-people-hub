"use client"

import { PaperclipIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Maintenance } from "@/lib/types"

export function MaintenanceDetailDialog({
  open,
  onOpenChange,
  record,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  record?: Maintenance
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            {record?.title ?? "Record"}
          </DialogTitle>
          <DialogDescription>
            {record?.kind ? record.kind : "Maintenance"} record
            {record?.category ? ` · ${record.category}` : ""}
          </DialogDescription>
        </DialogHeader>
        {record ? (
          <div className="grid gap-4 px-6 py-5">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{record.status}</Badge>
              <Badge variant="outline" className="capitalize">
                {record.priority} priority
              </Badge>
              {record.confidential ? (
                <Badge variant="destructive">Confidential</Badge>
              ) : null}
            </div>

            {record.description ? (
              <p className="text-sm text-muted-foreground">
                {record.description}
              </p>
            ) : null}

            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Kind" value={record.kind} />
              <Field label="Category" value={record.category} />
              <Field label="Raised by" value={record.raised_by} />
              <Field label="Assigned to" value={record.assigned_to} />
              <Field label="Contractor" value={record.contractor} />
              <Field
                label="Cost (KES)"
                value={
                  record.cost_kes != null
                    ? record.cost_kes.toLocaleString()
                    : null
                }
              />
            </dl>

            {record.resolution_notes ? (
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Resolution notes
                </p>
                <p className="mt-1 text-sm">{record.resolution_notes}</p>
              </div>
            ) : null}

            {record.photo_urls && record.photo_urls.length > 0 ? (
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Attachments
                </p>
                <ul className="mt-2 space-y-1">
                  {record.photo_urls.map((url) => (
                    <li key={url} className="truncate text-sm">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline"
                      >
                        <PaperclipIcon className="size-3.5 shrink-0" />
                        {url.split("/").pop()}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div>
      <dt className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium capitalize">
        {value || "—"}
      </dd>
    </div>
  )
}
