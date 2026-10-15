"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { FileTextIcon, FileUpIcon, Loader2Icon, XIcon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import toast from "react-hot-toast"

import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getErrorMessage } from "@/lib/api/errors"
import { staffKeys, uploadStaffDocument } from "@/lib/api/staff"
import { formatFileSize } from "@/lib/format"
import {
  DOCUMENT_MAX_MB,
  DOCUMENT_TYPES,
  staffDocumentSchema,
  type StaffDocumentValues,
} from "@/lib/schemas/staff"
import { documentCategoryLabels } from "@/lib/staff"
import type { DocumentCategory, StaffMember } from "@/lib/types"

type UploadDocumentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: StaffMember
}

export function UploadDocumentDialog({
  open,
  onOpenChange,
  staff,
}: UploadDocumentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 rounded-2xl p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Upload Document
          </DialogTitle>
          <DialogDescription>
            Add a document to {staff.full_name}&apos;s records.
          </DialogDescription>
        </DialogHeader>
        {/* Radix unmounts the content when closed, so the form starts fresh each time */}
        <UploadDocumentForm staff={staff} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function UploadDocumentForm({
  staff,
  onDone,
}: {
  staff: StaffMember
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (values: StaffDocumentValues) =>
      uploadStaffDocument(staff.staff_id, values),
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.all })
      const category = documentCategoryLabels[values.category]
      toast.success(`${category} uploaded for ${staff.full_name}`)
      onDone()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Couldn't upload this document."))
    },
  })

  const form = useForm<StaffDocumentValues>({
    resolver: zodResolver(staffDocumentSchema),
  })

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      className="space-y-5 px-6 py-5"
      noValidate
    >
      <Controller
        name="category"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="gap-2">
            <FieldLabel htmlFor="document-category">
              Category <span className="text-destructive">*</span>
            </FieldLabel>
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger
                id="document-category"
                aria-invalid={fieldState.invalid}
                className="h-12 w-full rounded-xl px-3.5 data-[size=default]:h-12"
              >
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(documentCategoryLabels).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value as DocumentCategory}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} className="text-xs" />
          </Field>
        )}
      />

      <Controller
        name="file"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="gap-2">
            <FieldLabel htmlFor="document-file">
              File <span className="text-destructive">*</span>
            </FieldLabel>
            {/* A picked file that fails validation keeps the picker on screen */}
            {field.value && !fieldState.invalid ? (
              <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-ink">
                  <FileTextIcon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {field.value.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(field.value.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove file"
                  disabled={mutation.isPending}
                  onClick={() => form.resetField("file")}
                  className="shrink-0 rounded-full text-muted-foreground hover:text-destructive"
                >
                  <XIcon />
                </Button>
              </div>
            ) : (
              <FileDropzone
                id="document-file"
                icon={FileUpIcon}
                noun="file"
                hint={`PDF, Word or image, up to ${DOCUMENT_MAX_MB} MB`}
                accept={DOCUMENT_TYPES.join(",")}
                invalid={fieldState.invalid}
                onPick={(file) =>
                  form.setValue("file", file, { shouldValidate: true })
                }
              />
            )}
            <FieldError errors={[fieldState.error]} className="text-xs" />
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-3 pt-1">
        <DialogClose asChild>
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending}
            className="h-11 rounded-xl"
          >
            Cancel
          </Button>
        </DialogClose>
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="h-11 rounded-xl"
        >
          {mutation.isPending && <Loader2Icon className="animate-spin" />}
          {mutation.isPending ? "Uploading…" : "Upload Document"}
        </Button>
      </div>
    </form>
  )
}
