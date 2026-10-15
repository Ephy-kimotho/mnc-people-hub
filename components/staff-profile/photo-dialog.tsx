"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ImageUpIcon, Loader2Icon, XIcon } from "lucide-react"
import { useEffect, useState } from "react"
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
import { Field, FieldError } from "@/components/ui/field"
import { getErrorMessage } from "@/lib/api/errors"
import { staffKeys, uploadStaffPhoto } from "@/lib/api/staff"
import {
  PHOTO_MAX_MB,
  PHOTO_TYPES,
  staffPhotoSchema,
  type StaffPhotoValues,
} from "@/lib/schemas/staff"
import type { StaffMember } from "@/lib/types"

type PhotoDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: StaffMember
}

export function PhotoDialog({ open, onOpenChange, staff }: PhotoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 rounded-2xl p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Update Profile Photo
          </DialogTitle>
          <DialogDescription>
            Upload a new photo for {staff.full_name}.
          </DialogDescription>
        </DialogHeader>
        {/* Radix unmounts the content when closed, so the form starts fresh each time */}
        <PhotoForm staff={staff} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function PhotoForm({
  staff,
  onDone,
}: {
  staff: StaffMember
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (values: StaffPhotoValues) =>
      uploadStaffPhoto(staff.staff_id, values.photo),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.all })
      toast.success(`${staff.full_name}'s photo has been updated`)
      onDone()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Couldn't upload this photo."))
    },
  })

  const form = useForm<StaffPhotoValues>({
    resolver: zodResolver(staffPhotoSchema),
  })

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      className="space-y-5 px-6 py-5"
      noValidate
    >
      <Controller
        name="photo"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="gap-2">
            {/* A picked file that fails validation keeps the picker on screen */}
            {field.value && !fieldState.invalid ? (
              <PhotoPreview
                file={field.value}
                disabled={mutation.isPending}
                onRemove={() => form.resetField("photo")}
              />
            ) : (
              <FileDropzone
                id="staff-photo"
                icon={ImageUpIcon}
                noun="photo"
                hint={`JPG, PNG or WebP, up to ${PHOTO_MAX_MB} MB`}
                accept={PHOTO_TYPES.join(",")}
                invalid={fieldState.invalid}
                onPick={(file) =>
                  form.setValue("photo", file, { shouldValidate: true })
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
          {mutation.isPending ? "Uploading…" : "Upload Photo"}
        </Button>
      </div>
    </form>
  )
}

function PhotoPreview({
  file,
  disabled,
  onRemove,
}: {
  file: File
  disabled: boolean
  onRemove: () => void
}) {
  const [url, setUrl] = useState<string>()

  // Reads the file into a data URL for the preview; a newer file or
  // unmounting cancels a read that's still running
  useEffect(() => {
    const reader = new FileReader()
    reader.onload = () => setUrl(reader.result as string)
    reader.readAsDataURL(file)
    return () => reader.abort()
  }, [file])

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border px-6 py-6">
      <div className="relative size-32">
        {url && (
          // A local data URL, which next/image can't optimise
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Selected photo preview"
            className="size-32 rounded-full object-cover shadow-md ring-4 ring-background"
          />
        )}
        <Button
          type="button"
          variant="destructive"
          size="icon"
          aria-label="Remove photo"
          disabled={disabled}
          onClick={onRemove}
          className="absolute -top-1 -right-1 size-8 rounded-full"
        >
          <XIcon />
        </Button>
      </div>
      <p className="max-w-full truncate text-sm text-muted-foreground">
        {file.name}
      </p>
    </div>
  )
}
