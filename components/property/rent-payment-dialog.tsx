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
import { propertyKeys, recordRentPayment } from "@/lib/api/properties"
import { rentPaymentSchema, type RentPaymentInput } from "@/lib/schemas/property"
import { formatCurrency } from "@/lib/format"
import type { RentCollection } from "@/lib/types"

const inputClass = "h-11 rounded-xl px-3.5"
const labelClass =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"

export function RentPaymentDialog({
  open,
  onOpenChange,
  row,
  period,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  row?: RentCollection
  period: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Record rent payment
          </DialogTitle>
          <DialogDescription>
            {row?.tenant_full_name || row?.tenant_company_name} ·{" "}
            {row?.property_alias} {row?.unit_label} · {period}
          </DialogDescription>
        </DialogHeader>
        {row ? (
          <PaymentForm
            row={row}
            period={period}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function PaymentForm({
  row,
  period,
  onDone,
}: {
  row: RentCollection
  period: string
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const outstanding = Math.max(
    0,
    (row.expected_kes ?? 0) - (row.paid_kes ?? 0)
  )
  const form = useForm<
    z.input<typeof rentPaymentSchema>,
    unknown,
    RentPaymentInput
  >({
    resolver: zodResolver(rentPaymentSchema),
    defaultValues: {
      paid_kes: outstanding || row.expected_kes || 0,
      payment_method: "mpesa",
      payment_ref: "",
      notes: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (values: RentPaymentInput) =>
      recordRentPayment(row.lease_id, period, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Rent payment recorded")
      onDone()
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't record the payment.")),
  })

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      noValidate
    >
      <fieldset disabled={mutation.isPending} className="grid gap-4 px-6 py-5">
        <div className="flex justify-between rounded-xl bg-muted/50 px-4 py-3 text-sm">
          <span>Outstanding</span>
          <span className="font-semibold">{formatCurrency(outstanding)}</span>
        </div>
        <div className="grid gap-2">
          <FieldLabel htmlFor="rent-paid" className={labelClass}>
            Amount paid (KES)
          </FieldLabel>
          <Input
            id="rent-paid"
            type="number"
            min="0"
            className={inputClass}
            {...form.register("paid_kes")}
          />
          <FieldError>{form.formState.errors.paid_kes?.message}</FieldError>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="rent-method" className={labelClass}>
              Method
            </FieldLabel>
            <select
              id="rent-method"
              className={inputClass}
              {...form.register("payment_method")}
            >
              <option value="mpesa">M-Pesa</option>
              <option value="cash">Cash</option>
              <option value="bank">Bank transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="rent-ref" className={labelClass}>
              Reference
            </FieldLabel>
            <Input
              id="rent-ref"
              className={inputClass}
              {...form.register("payment_ref")}
            />
          </div>
        </div>
        <div className="grid gap-2">
          <FieldLabel htmlFor="rent-notes" className={labelClass}>
            Notes
          </FieldLabel>
          <Textarea id="rent-notes" rows={2} {...form.register("notes")} />
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
          Record payment
        </Button>
      </DialogFooter>
    </form>
  )
}
