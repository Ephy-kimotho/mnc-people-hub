"use client"

import { useQuery } from "@tanstack/react-query"
import {
  FileImageIcon,
  FileTextIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"
import { useState } from "react"

import { DeleteDocumentDialog } from "@/components/staff-profile/delete-document-dialog"
import { UploadDocumentDialog } from "@/components/staff-profile/upload-document-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getErrorMessage } from "@/lib/api/errors"
import { fetchStaffDocuments, staffKeys } from "@/lib/api/staff"
import { formatDate, formatFileSize } from "@/lib/format"
import { documentCategoryLabels } from "@/lib/staff"
import type { DocumentCategory, StaffDocument, StaffMember } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

// Groups follow the category list's order; unknown categories go last
const categoryOrder = Object.keys(documentCategoryLabels)

function groupByCategory(documents: StaffDocument[]) {
  const groups = new Map<string, StaffDocument[]>()
  const sorted = documents.toSorted(
    (a, b) =>
      rank(a.category) - rank(b.category) ||
      b.uploaded_at.localeCompare(a.uploaded_at)
  )
  for (const doc of sorted) {
    groups.set(doc.category, [...(groups.get(doc.category) ?? []), doc])
  }
  return [...groups]
}

function rank(category: string) {
  const index = categoryOrder.indexOf(category)
  return index === -1 ? categoryOrder.length : index
}

export function DocumentsCard({ staff }: { staff: StaffMember }) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<StaffDocument>()
  // Uploads and deletes follow the profile edit rule: admins and managers only
  const canManage = user?.role === "admin" || user?.role === "manager"

  // Refetched after an upload, since that invalidates every staff query
  const query = useQuery({
    queryKey: staffKeys.documents(staff.staff_id),
    queryFn: () => fetchStaffDocuments(staff.staff_id),
  })
  const count = query.data?.length ?? 0

  return (
    <Card className="gap-0 rounded-2xl py-0 shadow-xs">
      <div className="flex items-center gap-4 border-b px-6 py-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <FileTextIcon className="size-4" />
        </span>
        <div className="flex-1">
          <h2 className="font-heading text-base font-semibold">Documents</h2>
          <p className="text-xs text-muted-foreground">
            {query.isSuccess
              ? `${count} ${count === 1 ? "file" : "files"} on record`
              : "Contracts, IDs and other records"}
          </p>
        </div>
        {canManage && (
          <Button
            variant="outline"
            className="h-9 rounded-full px-4"
            onClick={() => setUploading(true)}
          >
            <UploadIcon />
            Upload
          </Button>
        )}
      </div>

      {query.isPending ? (
        <div className="space-y-3 px-6 py-5">
          {Array.from({ length: 2 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(query.error, "Couldn't load documents.")}
          </p>
          <Button
            variant="outline"
            className="h-10 rounded-full px-5"
            onClick={() => query.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : count === 0 ? (
        <p className="m-6 rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No documents uploaded yet.
        </p>
      ) : (
        <div className="divide-y">
          {groupByCategory(query.data).map(([category, documents]) => (
            <section key={category} className="space-y-3 px-6 py-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                {documentCategoryLabels[category as DocumentCategory] ??
                  category}
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {documents.length}
                </span>
              </h3>
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <DocumentRow
                    key={doc.document_id}
                    doc={doc}
                    onDelete={
                      canManage
                        ? () => {
                            setSelected(doc)
                            setDeleteOpen(true)
                          }
                        : undefined
                    }
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {canManage && (
        <>
          <UploadDocumentDialog
            open={uploading}
            onOpenChange={setUploading}
            staff={staff}
          />
          <DeleteDocumentDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            document={selected}
          />
        </>
      )}
    </Card>
  )
}

// `onDelete` is left out for people who can't delete documents
function DocumentRow({
  doc,
  onDelete,
}: {
  doc: StaffDocument
  onDelete?: () => void
}) {
  const Icon = doc.mime_type.startsWith("image/") ? FileImageIcon : FileTextIcon

  return (
    <li className="flex items-center gap-3 rounded-xl border px-4 py-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-ink">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        {/* The name opens the file in a new tab */}
        <a
          href={doc.public_url}
          target="_blank"
          rel="noopener noreferrer"
          title={doc.filename}
          className="block truncate text-sm font-medium underline-offset-4 hover:underline"
        >
          {doc.filename}
        </a>
        <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          <span>{formatFileSize(doc.file_size_bytes)}</span>
          <span aria-hidden>·</span>
          <span>Uploaded {formatDate(doc.uploaded_at)}</span>
          {doc.expiry_date && (
            <>
              <span aria-hidden>·</span>
              <span>Expires {formatDate(doc.expiry_date)}</span>
            </>
          )}
          {doc.restricted && (
            <Badge className="ml-1 h-5 bg-muted text-muted-foreground">
              Restricted
            </Badge>
          )}
        </p>
      </div>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${doc.filename}`}
          onClick={onDelete}
          className="shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2Icon />
        </Button>
      )}
    </li>
  )
}
