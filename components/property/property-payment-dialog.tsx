"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

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
import { FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getErrorMessage } from "@/lib/api/errors"
import {
  createPropertyPayment,
  propertyKeys,
} from "@/lib/api/properties"
import { formatISODate } from "@/lib/format"

const inputClass = "h-11 rounded-xl px-3.5"
const labelClass =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"

const paymentTypes = ["Land Rent", "County Rates", "Other"]

export function PropertyPaymentDialog({
  open,
  onOpenChange,
  propertyId,
  propertyAlias,
  defaultType = "Land Rent",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyId: string
  propertyAlias: string
  defaultType?: string
}) {
  const queryClient = useQueryClient()
  const [paymentType, setPaymentType] = useState(defaultType)
  const [amount, setAmount] = useState("")
  const [paidOn, setPaidOn] = useState(formatISODate(new Date()))
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")

  const mutation = useMutation({
    mutationFn: () =>
      createPropertyPayment(propertyId, {
        payment_type: paymentType,
        amount_kes: Number(amount),
        paid_on: paidOn || undefined,
        reference: reference || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: propertyKeys.payments(propertyId),
      })
      toast.success("Payment logged")
      setAmount("")
      setReference("")
      setNotes("")
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't log the payment.")),
  })

  const invalidAmount = !amount || Number(amount) <= 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-x-hidden p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Log compliance payment
          </DialogTitle>
          <DialogDescription>
            {propertyAlias} · Land rent, county rates or other statutory payment
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (invalidAmount) {
              toast.error("Enter an amount greater than zero.")
              return
            }
            mutation.mutate()
          }}
          noValidate
        >
          <fieldset
            disabled={mutation.isPending}
            className="grid gap-4 px-6 py-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <FieldLabel htmlFor="payment-type" className={labelClass}>
                  Payment type
                </FieldLabel>
                <select
                  id="payment-type"
                  className={inputClass}
                  value={paymentType}
                  onChange={(event) => setPaymentType(event.target.value)}
                >
                  {paymentTypes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <FieldLabel htmlFor="payment-amount" className={labelClass}>
                  Amount (KES)
                </FieldLabel>
                <Input
                  id="payment-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  className={inputClass}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <FieldLabel htmlFor="payment-date" className={labelClass}>
                  Paid on
                </FieldLabel>
                <DatePicker
                  id="payment-date"
                  value={paidOn}
                  onChange={setPaidOn}
                  className={inputClass}
                />
              </div>
              <div className="grid gap-2">
                <FieldLabel htmlFor="payment-ref" className={labelClass}>
                  Reference
                </FieldLabel>
                <Input
                  id="payment-ref"
                  className={inputClass}
                  placeholder="Receipt or transaction number"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="payment-notes" className={labelClass}>
                Notes
              </FieldLabel>
              <Textarea
                id="payment-notes"
                rows={2}
                placeholder="Optional details about this payment."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
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
              disabled={mutation.isPending || invalidAmount}
            >
              {mutation.isPending && <Loader2Icon className="animate-spin" />}
              Log payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
