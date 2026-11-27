"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon, UploadCloudIcon } from "lucide-react"
import { useRef, useState } from "react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getErrorMessage } from "@/lib/api/errors"
import {
  propertyKeys,
  uploadTenantDocument,
} from "@/lib/api/properties"

const inputClass = "h-11 rounded-xl px-3.5"
const labelClass =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"

const categories = ["ID/Passport", "Employer Letter", "Contract", "Other"]

export function TenantDocumentDialog({
  open,
  onOpenChange,
  tenantId,
  defaultCategory,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  defaultCategory?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-x-hidden p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Upload tenant document
          </DialogTitle>
          <DialogDescription>
            ID/passport scans, employer letters or other files.
          </DialogDescription>
        </DialogHeader>
        <TenantDocumentForm
          tenantId={tenantId}
          defaultCategory={defaultCategory}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function TenantDocumentForm({
  tenantId,
  defaultCategory,
  onDone,
}: {
  tenantId: string
  defaultCategory?: string
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [category, setCategory] = useState(defaultCategory ?? "ID/Passport")
  const [file, setFile] = useState<File>()
  const fileInput = useRef<HTMLInputElement>(null)

  const mutation = useMutation({
    mutationFn: () =>
      uploadTenantDocument(tenantId, {
        name: name.trim() || file?.name || "Document",
        category,
        file: file as File,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Document uploaded")
      onDone()
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't upload the document.")),
  })

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0]
    if (!picked) return
    if (!["application/pdf", "image/jpeg", "image/png"].includes(picked.type)) {
      toast.error("Choose a PDF, JPEG or PNG file.")
      return
    }
    setFile(picked)
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (file) mutation.mutate()
      }}
      noValidate
    >
      <fieldset
        disabled={mutation.isPending}
        className="grid gap-4 px-6 py-5"
      >
        <div className="grid gap-2">
          <FieldLabel htmlFor="tenant-doc-name" className={labelClass}>
            Document name
          </FieldLabel>
          <Input
            id="tenant-doc-name"
            placeholder="e.g. National ID scan"
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <FieldLabel htmlFor="tenant-doc-category" className={labelClass}>
            Category
          </FieldLabel>
          <select
            id="tenant-doc-category"
            className={inputClass}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-6 text-center transition-colors hover:bg-muted/40"
        >
          <UploadCloudIcon className="size-6 text-muted-foreground" />
          <span className="text-sm">
            <span className="font-medium">Click to upload</span> a PDF or image
          </span>
          {file ? (
            <span className="text-xs font-medium text-emerald-800">
              {file.name}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              PDF, JPEG, PNG up to 15 MB
            </span>
          )}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,image/jpeg,image/png"
          className="hidden"
          onChange={onPick}
        />
      </fieldset>
      <DialogFooter className="border-t px-6 py-4">
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-xl px-5"
          onClick={onDone}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="h-10 rounded-xl bg-emerald-800 px-5 text-white hover:bg-emerald-900"
          disabled={mutation.isPending || !file}
        >
          {mutation.isPending && <Loader2Icon className="animate-spin" />}
          Upload document
        </Button>
      </DialogFooter>
    </form>
  )
}
