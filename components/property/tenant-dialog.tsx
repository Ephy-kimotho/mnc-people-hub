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
import { getErrorMessage } from "@/lib/api/errors"
import {
  createTenant,
  propertyKeys,
  updateTenant,
} from "@/lib/api/properties"
import { tenantSchema, type TenantInput } from "@/lib/schemas/property"
import type { Tenant } from "@/lib/types"

const inputClass = "h-11 rounded-xl px-3.5"
const labelClass =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"

export function TenantDialog({
  open,
  onOpenChange,
  tenant,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant?: Tenant
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            {tenant ? "Edit tenant" : "Add tenant"}
          </DialogTitle>
          <DialogDescription>
            {tenant
              ? "Update the tenant's contact details."
              : "Create a tenant record. Leases are added separately."}
          </DialogDescription>
        </DialogHeader>
        <TenantForm
          tenant={tenant}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function TenantForm({
  tenant,
  onDone,
}: {
  tenant?: Tenant
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const form = useForm<z.input<typeof tenantSchema>, unknown, TenantInput>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      type: (tenant?.type as TenantInput["type"]) ?? "individual",
      full_name: tenant?.full_name ?? "",
      company_name: tenant?.company_name ?? "",
      phone: tenant?.phone ?? "",
      email: tenant?.email ?? "",
      notes: tenant?.notes ?? "",
      consent: tenant?.consent ?? true,
    },
  })
  const type = form.watch("type")

  const mutation = useMutation({
    mutationFn: (values: TenantInput) =>
      tenant ? updateTenant(tenant.tenant_id, values) : createTenant(values),
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success(
        `${values.full_name || values.company_name} has been ${
          tenant ? "updated" : "added"
        }`
      )
      onDone()
    },
    onError: (error) =>
      toast.error(
        getErrorMessage(
          error,
          tenant ? "Couldn't update this tenant." : "Couldn't add the tenant."
        )
      ),
  })

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      noValidate
    >
      <fieldset
        disabled={mutation.isPending}
        className="grid max-h-[75vh] gap-4 overflow-y-auto px-6 py-5"
      >
        <div className="grid gap-2">
          <FieldLabel htmlFor="tenant-type" className={labelClass}>
            Tenant type
          </FieldLabel>
          <select
            id="tenant-type"
            className={inputClass}
            {...form.register("type")}
          >
            <option value="individual">Individual</option>
            <option value="company">Company</option>
          </select>
        </div>

        {type === "individual" ? (
          <div className="grid gap-2">
            <FieldLabel htmlFor="tenant-name" className={labelClass}>
              Full name
            </FieldLabel>
            <Input
              id="tenant-name"
              placeholder="Jane Wanjiku"
              className={inputClass}
              {...form.register("full_name")}
            />
            <FieldError>{form.formState.errors.full_name?.message}</FieldError>
          </div>
        ) : (
          <div className="grid gap-2">
            <FieldLabel htmlFor="tenant-company" className={labelClass}>
              Company name
            </FieldLabel>
            <Input
              id="tenant-company"
              placeholder="Acme Holdings Ltd"
              className={inputClass}
              {...form.register("company_name")}
            />
            <FieldError>
              {form.formState.errors.company_name?.message}
            </FieldError>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="tenant-phone" className={labelClass}>
              Phone
            </FieldLabel>
            <Input
              id="tenant-phone"
              placeholder="+254 7…"
              className={inputClass}
              {...form.register("phone")}
            />
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="tenant-email" className={labelClass}>
              Email
            </FieldLabel>
            <Input
              id="tenant-email"
              type="email"
              placeholder="tenant@example.com"
              className={inputClass}
              {...form.register("email")}
            />
            <FieldError>{form.formState.errors.email?.message}</FieldError>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register("consent")} />
          Consent to store contact details
        </label>

        <div className="grid gap-2">
          <FieldLabel htmlFor="tenant-notes" className={labelClass}>
            Notes
          </FieldLabel>
          <Textarea
            id="tenant-notes"
            rows={3}
            {...form.register("notes")}
          />
        </div>
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
          className="h-10 rounded-xl px-5"
          disabled={mutation.isPending}
        >
          {mutation.isPending && <Loader2Icon className="animate-spin" />}
          {tenant ? "Save changes" : "Add tenant"}
        </Button>
      </DialogFooter>
    </form>
  )
}
