"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon } from "lucide-react"
import toast from "react-hot-toast"
import { useForm } from "react-hook-form"
import type { z } from "zod"

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
import { useProperties } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import { createMaintenance, propertyKeys } from "@/lib/api/properties"
import {
  maintenanceSchema,
  type MaintenanceInput,
} from "@/lib/schemas/property"

const inputClass = "h-11 rounded-xl px-3.5"
const labelClass =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"

export function MaintenanceDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const properties = useProperties()
  const form = useForm<
    z.input<typeof maintenanceSchema>,
    unknown,
    MaintenanceInput
  >({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      property_id: "",
      unit_id: "",
      tenant_id: "",
      kind: "maintenance",
      title: "",
      description: "",
      category: "",
      priority: "medium",
      assigned_to: "",
      contractor: "",
      cost_kes: undefined,
      confidential: false,
    },
  })

  const mutation = useMutation({
    mutationFn: (values: MaintenanceInput) => createMaintenance(values),
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success(`${values.title} logged`)
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't log the request.")),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Log maintenance
          </DialogTitle>
          <DialogDescription>
            A repair, maintenance job or tenant complaint.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <fieldset
            disabled={mutation.isPending}
            className="grid max-h-[75vh] gap-4 overflow-y-auto px-6 py-5"
          >
            <div className="grid gap-2">
              <FieldLabel htmlFor="maint-property" className={labelClass}>
                Property
              </FieldLabel>
              <select
                id="maint-property"
                className={inputClass}
                {...form.register("property_id")}
              >
                <option value="">Choose a property</option>
                {(properties.data ?? []).map((property) => (
                  <option
                    key={property.property_id}
                    value={property.property_id}
                  >
                    {property.alias}
                  </option>
                ))}
              </select>
              <FieldError>
                {form.formState.errors.property_id?.message}
              </FieldError>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <FieldLabel htmlFor="maint-kind" className={labelClass}>
                  Kind
                </FieldLabel>
                <select
                  id="maint-kind"
                  className={inputClass}
                  {...form.register("kind")}
                >
                  <option value="maintenance">Maintenance</option>
                  <option value="repair">Repair</option>
                  <option value="complaint">Complaint</option>
                </select>
              </div>
              <div className="grid gap-2">
                <FieldLabel htmlFor="maint-priority" className={labelClass}>
                  Priority
                </FieldLabel>
                <select
                  id="maint-priority"
                  className={inputClass}
                  {...form.register("priority")}
                >
                  {["low", "medium", "high", "urgent"].map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="maint-title" className={labelClass}>
                Title
              </FieldLabel>
              <Input
                id="maint-title"
                placeholder="Leaking kitchen tap"
                className={inputClass}
                {...form.register("title")}
              />
              <FieldError>{form.formState.errors.title?.message}</FieldError>
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="maint-description" className={labelClass}>
                Description
              </FieldLabel>
              <Textarea
                id="maint-description"
                rows={3}
                {...form.register("description")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <FieldLabel htmlFor="maint-category" className={labelClass}>
                  Category
                </FieldLabel>
                <Input
                  id="maint-category"
                  placeholder="Plumbing"
                  className={inputClass}
                  {...form.register("category")}
                />
              </div>
              <div className="grid gap-2">
                <FieldLabel htmlFor="maint-assigned" className={labelClass}>
                  Assigned to
                </FieldLabel>
                <Input
                  id="maint-assigned"
                  className={inputClass}
                  {...form.register("assigned_to")}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <FieldLabel htmlFor="maint-contractor" className={labelClass}>
                  Contractor
                </FieldLabel>
                <Input
                  id="maint-contractor"
                  className={inputClass}
                  {...form.register("contractor")}
                />
              </div>
              <div className="grid gap-2">
                <FieldLabel htmlFor="maint-cost" className={labelClass}>
                  Cost (KES)
                </FieldLabel>
                <Input
                  id="maint-cost"
                  type="number"
                  min="0"
                  className={inputClass}
                  {...form.register("cost_kes")}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register("confidential")} />
              Confidential
            </label>
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
              Log request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
