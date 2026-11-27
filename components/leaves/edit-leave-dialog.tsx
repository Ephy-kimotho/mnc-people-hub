"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon, PaperclipIcon, UploadCloudIcon } from "lucide-react"
import { useRef, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import toast from "react-hot-toast"

import { DatePicker } from "@/components/date-picker"
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
import { Textarea } from "@/components/ui/textarea"
import { getErrorMessage } from "@/lib/api/errors"
import {
  deleteLeaveDocument,
  fetchLeaveDocumentUrl,
  leaveKeys,
  uploadLeaveDocument,
} from "@/lib/api/leaves"
import { halfDayTimes, leaveTypeLabels } from "@/lib/leave"
import {
  REASON_MAX,
  leaveRequestSchema,
  type LeaveRequestValues,
} from "@/lib/schemas/leave"
import type { LeaveRequest, LeaveType } from "@/lib/types"
import { cn } from "@/lib/utils"

type EditLeaveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  request?: LeaveRequest
  name?: string
  saving?: boolean
  onSave: (values: LeaveRequestValues) => void
}

const inputClass = "h-12 rounded-xl px-3.5"

export function EditLeaveDialog({
  open,
  onOpenChange,
  request,
  name,
  saving = false,
  onSave,
}: EditLeaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 rounded-2xl p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Edit Leave Request
          </DialogTitle>
          <DialogDescription>
            Update the leave details for {name}.
          </DialogDescription>
        </DialogHeader>
        {/* Radix unmounts the content when closed, so the form refills each time */}
        {request && (
          <EditLeaveForm
            request={request}
            saving={saving}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditLeaveForm({
  request,
  saving,
  onSave,
}: {
  request: LeaveRequest
  saving: boolean
  onSave: (values: LeaveRequestValues) => void
}) {
  const form = useForm<LeaveRequestValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      staffId: request.staffId,
      type: request.type,
      // Not editable here, but the schema checks them against the dates
      durationType: request.durationType,
      halfDayPeriod: request.halfDayPeriod ?? "AM",
      startDate: request.startDate,
      endDate: request.endDate,
      startTime: request.startTime ?? halfDayTimes.AM.startTime,
      endTime: request.endTime ?? halfDayTimes.PM.endTime,
      reason: request.reason ?? "",
    },
  })
  const startDate = useWatch({ control: form.control, name: "startDate" })
  const queryClient = useQueryClient()
  const [docName, setDocName] = useState(request.documentName)
  const fileInput = useRef<HTMLInputElement>(null)

  const upload = useMutation({
    mutationFn: (picked: File) => uploadLeaveDocument(request.id, picked),
    onSuccess: (_data, picked) => {
      void queryClient.invalidateQueries({ queryKey: leaveKeys.all })
      setDocName(picked.name)
      toast.success("Document uploaded")
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't upload the document.")),
  })

  const remove = useMutation({
    mutationFn: () => deleteLeaveDocument(request.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leaveKeys.all })
      setDocName(undefined)
      toast.success("Document removed")
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't remove the document.")),
  })

  async function viewDocument() {
    try {
      const { url } = await fetchLeaveDocumentUrl(request.id)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't open the document."))
    }
  }

  function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0]
    if (!picked) return
    if (!["application/pdf", "image/jpeg", "image/png"].includes(picked.type)) {
      toast.error("Choose a PDF, JPEG or PNG file.")
      return
    }
    if (picked.size > 15 * 1024 * 1024) {
      toast.error("The file must be 15 MB or smaller.")
      return
    }
    upload.mutate(picked)
    event.target.value = ""
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSave)}
      className="space-y-5 px-6 py-5"
      noValidate
    >
      <Controller
        name="type"
        control={form.control}
        render={({ field }) => (
          <Field className="gap-2">
            <FieldLabel htmlFor="edit-leave-type">Leave Type</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="edit-leave-type"
                className={cn("w-full data-[size=default]:h-12", inputClass)}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(leaveTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value as LeaveType}>
                    {label} Leave
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      />

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
        <Controller
          name="startDate"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-2">
              <FieldLabel htmlFor="edit-leave-start">Start Date</FieldLabel>
              <DatePicker
                id="edit-leave-start"
                value={field.value}
                onChange={field.onChange}
                placeholder="Pick a start date"
                invalid={fieldState.invalid}
                className={inputClass}
              />
              <FieldError errors={[fieldState.error]} className="text-xs" />
            </Field>
          )}
        />
        <Controller
          name="endDate"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-2">
              <FieldLabel htmlFor="edit-leave-end">End Date</FieldLabel>
              <DatePicker
                id="edit-leave-end"
                value={field.value}
                onChange={field.onChange}
                placeholder="Pick an end date"
                invalid={fieldState.invalid}
                minDate={startDate || undefined}
                className={inputClass}
              />
              <FieldError errors={[fieldState.error]} className="text-xs" />
            </Field>
          )}
        />
      </div>

      <Controller
        name="reason"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="gap-2">
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="edit-leave-reason">Reason</FieldLabel>
              <span className="text-sm text-muted-foreground">(Optional)</span>
            </div>
            <Textarea
              {...field}
              id="edit-leave-reason"
              rows={3}
              maxLength={REASON_MAX}
              placeholder="Write your reason here...."
              aria-invalid={fieldState.invalid}
              className="min-h-20 rounded-xl px-3.5 py-3"
            />
            <FieldError errors={[fieldState.error]} className="text-xs" />
          </Field>
        )}
      />

      <div className="rounded-xl border px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium">Supporting document</p>
            <p className="truncate text-xs text-muted-foreground">
              {docName ?? "No document attached"}
            </p>
          </div>
          {docName ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 rounded-full px-3"
              onClick={viewDocument}
            >
              <PaperclipIcon />
              View
            </Button>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-full px-3"
            disabled={upload.isPending}
            onClick={() => fileInput.current?.click()}
          >
            {upload.isPending ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <UploadCloudIcon />
            )}
            {docName ? "Replace" : "Upload"}
          </Button>
          {docName ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-full px-3 text-destructive"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
            >
              {remove.isPending ? (
                <Loader2Icon className="animate-spin" />
              ) : null}
              Remove
            </Button>
          ) : null}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,image/jpeg,image/png"
          className="hidden"
          onChange={onPickFile}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <DialogClose asChild>
          <Button type="button" variant="outline" className="h-11 rounded-xl">
            Cancel
          </Button>
        </DialogClose>
        <Button
          type="submit"
          className="h-11 rounded-xl"
          disabled={saving || upload.isPending || remove.isPending}
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
