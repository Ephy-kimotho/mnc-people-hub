"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon } from "lucide-react"
import toast from "react-hot-toast"
import { Controller, useForm } from "react-hook-form"
import type { z } from "zod"

import { DatePicker } from "@/components/date-picker"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getErrorMessage } from "@/lib/api/errors"
import { createReminder, propertyKeys } from "@/lib/api/properties"
import { reminderSchema, type ReminderInput } from "@/lib/schemas/property"

const inputClass = "h-11 rounded-xl px-3.5"
const labelClass =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"
const kinds = ["rent", "lease", "deposit", "document", "insurance", "note", "other"]

export function ReminderDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const form = useForm<
    z.input<typeof reminderSchema>,
    unknown,
    ReminderInput
  >({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      property_id: "",
      tenant_id: "",
      lease_id: "",
      kind: "rent",
      title: "",
      detail: "",
      due_on: "",
      severity: "medium",
    },
  })

  const mutation = useMutation({
    mutationFn: (values: ReminderInput) => createReminder(values),
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success(`${values.title} added`)
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't add the reminder.")),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-x-hidden p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Add reminder
          </DialogTitle>
          <DialogDescription>
            Something that needs following up on the portfolio.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <fieldset
            disabled={mutation.isPending}
            className="grid gap-4 px-6 py-5"
          >
            <div className="grid gap-2">
              <FieldLabel htmlFor="reminder-title" className={labelClass}>
                Title
              </FieldLabel>
              <Input
                id="reminder-title"
                placeholder="Chase October rent"
                className={inputClass}
                {...form.register("title")}
              />
              <FieldError>{form.formState.errors.title?.message}</FieldError>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <FieldLabel htmlFor="reminder-kind" className={labelClass}>
                  Kind
                </FieldLabel>
                <select
                  id="reminder-kind"
                  className={inputClass}
                  {...form.register("kind")}
                >
                  {kinds.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <FieldLabel htmlFor="reminder-severity" className={labelClass}>
                  Severity
                </FieldLabel>
                <select
                  id="reminder-severity"
                  className={inputClass}
                  {...form.register("severity")}
                >
                  {["low", "medium", "high", "critical"].map((severity) => (
                    <option key={severity} value={severity}>
                      {severity}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <FieldLabel className={labelClass}>Due</FieldLabel>
                <Controller
                  control={form.control}
                  name="due_on"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="No date"
                      className={inputClass}
                    />
                  )}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="reminder-detail" className={labelClass}>
                Details
              </FieldLabel>
              <Textarea
                id="reminder-detail"
                rows={3}
                {...form.register("detail")}
              />
            </div>
          </fieldset>
          <DialogFooter className="border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl px-5"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 rounded-xl px-5"
              disabled={mutation.isPending}
            >
              {mutation.isPending && <Loader2Icon className="animate-spin" />}
              Add reminder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
