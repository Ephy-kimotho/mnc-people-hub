"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  FileTextIcon,
  ImageIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
  UploadCloudIcon,
} from "lucide-react"
import { useRef, useState } from "react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PropertyDocumentDialog } from "@/components/property/property-record-dialogs"
import { usePropertyDocuments } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import {
  deletePropertyDocument,
  deletePropertyPhoto,
  propertyKeys,
  uploadPropertyPhoto,
} from "@/lib/api/properties"
import { formatDate, formatFileSize } from "@/lib/format"
import type { Property } from "@/lib/types"

export function PropertyDocumentsTab({
  property,
  propertyId,
  canManage,
}: {
  property: Property
  propertyId: string
  canManage: boolean
}) {
  const queryClient = useQueryClient()
  const documents = usePropertyDocuments(propertyId)
  const [uploadOpen, setUploadOpen] = useState(false)
  const photoInput = useRef<HTMLInputElement>(null)

  const removeDocument = useMutation({
    mutationFn: (id: string) => deletePropertyDocument(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Document deleted")
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't delete the document.")),
  })

  const uploadPhoto = useMutation({
    mutationFn: (file: File) => uploadPropertyPhoto(propertyId, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Property photo updated")
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't upload the photo.")),
  })

  const removePhoto = useMutation({
    mutationFn: () => deletePropertyPhoto(propertyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Property photo removed")
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't remove the photo.")),
  })

  function pickPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    uploadPhoto.mutate(file)
    event.target.value = ""
  }

  return (
    <div className="grid gap-4 p-5">
      <Card className="gap-0 rounded-2xl p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2 className="font-heading text-lg font-semibold">
              Property documents
            </h2>
            <p className="text-sm text-muted-foreground">
              Title deeds, insurance copies and site maps.
            </p>
          </div>
          {canManage ? (
            <Button
              className="h-9 rounded-full bg-emerald-800 px-4 text-white hover:bg-emerald-900"
              onClick={() => setUploadOpen(true)}
            >
              <PlusIcon />
              Upload document
            </Button>
          ) : null}
        </div>

        {documents.isPending ? (
          <Skeleton className="m-5 h-16 rounded-xl" />
        ) : documents.isError ? (
          <p className="px-5 py-8 text-sm text-destructive">
            {getErrorMessage(documents.error, "Couldn't load documents.")}
          </p>
        ) : (documents.data ?? []).length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-sm text-muted-foreground">
            <FileTextIcon className="size-5 text-emerald-800" />
            No documents uploaded yet. Add title deeds, insurance, or site maps
            here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <th className="px-5 py-3">Document name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Date uploaded</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(documents.data ?? []).map((document) => (
                  <tr key={document.document_id}>
                    <td className="px-5 py-3 font-medium">
                      {document.public_url ? (
                        <a
                          href={document.public_url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          {document.name}
                        </a>
                      ) : (
                        document.name
                      )}
                      {document.file_size_bytes ? (
                        <p className="text-xs font-normal text-muted-foreground">
                          {formatFileSize(document.file_size_bytes)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {document.category}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatDate(document.uploaded_at)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {canManage ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full text-destructive"
                          disabled={removeDocument.isPending}
                          onClick={() =>
                            removeDocument.mutate(document.document_id)
                          }
                        >
                          {removeDocument.isPending ? (
                            <Loader2Icon className="animate-spin" />
                          ) : (
                            <Trash2Icon />
                          )}
                          Delete
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="gap-0 rounded-2xl p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2 className="font-heading text-lg font-semibold">
              Property photos
            </h2>
            <p className="text-sm text-muted-foreground">
              Document the property&apos;s condition.
            </p>
          </div>
          {canManage ? (
            <Button
              variant="outline"
              className="h-9 rounded-full px-4"
              disabled={uploadPhoto.isPending}
              onClick={() => photoInput.current?.click()}
            >
              {uploadPhoto.isPending ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <UploadCloudIcon />
              )}
              Upload photo
            </Button>
          ) : null}
          <input
            ref={photoInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={pickPhoto}
          />
        </div>

        <div className="p-5">
          {property.photo_url ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={property.photo_url}
                alt={`${property.alias} photo`}
                className="max-h-80 w-full rounded-xl object-cover"
              />
              {canManage ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-destructive"
                  disabled={removePhoto.isPending}
                  onClick={() => removePhoto.mutate()}
                >
                  {removePhoto.isPending ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    <Trash2Icon />
                  )}
                  Remove photo
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
              <ImageIcon className="size-5" />
              No photo added yet. Upload an image to document the property.
            </div>
          )}
        </div>
      </Card>

      <PropertyDocumentDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        propertyId={propertyId}
      />
    </div>
  )
}
