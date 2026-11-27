"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon, PlusIcon, ReceiptTextIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

import { PropertyPaymentDialog } from "@/components/property/property-payment-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePropertyPayments } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import {
  deletePropertyPayment,
  propertyKeys,
} from "@/lib/api/properties"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Property, PropertyPayment } from "@/lib/types"

function Detail({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: "warning" | "success"
}) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd
        className={
          tone === "warning"
            ? "mt-1 text-sm font-medium text-amber-700 dark:text-amber-300"
            : tone === "success"
              ? "mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-300"
              : "mt-1 text-sm font-medium"
        }
      >
        {value}
      </dd>
    </div>
  )
}

export function PropertyComplianceCard({
  property,
  canManage,
}: {
  property: Property
  canManage: boolean
}) {
  const queryClient = useQueryClient()
  const payments = usePropertyPayments(property.property_id)
  const [dialog, setDialog] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<PropertyPayment>()

  const remove = useMutation({
    mutationFn: (paymentId: string) => deletePropertyPayment(paymentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: propertyKeys.payments(property.property_id),
      })
      setToDelete(undefined)
      toast.success("Payment removed")
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't remove the payment.")),
  })

  const rows = payments.data ?? []
  const landRentPaid = rows
    .filter((row) => row.payment_type === "Land Rent")
    .reduce((sum, row) => sum + Number(row.amount_kes), 0)
  const ratesPaid = rows
    .filter((row) => row.payment_type === "County Rates")
    .reduce((sum, row) => sum + Number(row.amount_kes), 0)
  const lastPayment = rows[0]

  const gazette = property.gazette_status || "Not Gazetted"
  const gazetteTone =
    gazette === "Gazetted"
      ? "success"
      : gazette === "Not Gazetted" || gazette === "In Progress"
        ? "warning"
        : undefined

  return (
    <Card className="gap-4 rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold">
          Compliance &amp; status
        </h2>
        {canManage ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-full px-3"
            onClick={() => setDialog("payment")}
          >
            <PlusIcon />
            Log payment
          </Button>
        ) : null}
      </div>

      <dl className="grid gap-4 sm:grid-cols-3">
        <Detail
          label="Land rent"
          value={property.land_rent_status || "Unknown"}
          tone={
            property.land_rent_status === "Paid"
              ? "success"
              : property.land_rent_status === "In Arrears"
                ? "warning"
                : undefined
          }
        />
        <Detail
          label="County rates"
          value={property.rates_status || "Unknown"}
          tone={
            property.rates_status === "Paid"
              ? "success"
              : property.rates_status === "In Arrears"
                ? "warning"
                : undefined
          }
        />
        <Detail label="Gazette status" value={gazette} tone={gazetteTone} />
      </dl>

      <div className="border-t pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-heading text-sm font-semibold">Payment history</p>
          <p className="text-xs text-muted-foreground">
            Land rent {formatCurrency(landRentPaid)} · Rates{" "}
            {formatCurrency(ratesPaid)}
          </p>
        </div>

        {payments.isPending ? (
          <div className="mt-3 space-y-2">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ) : payments.isError ? (
          <p className="mt-3 text-sm text-destructive">
            Couldn&apos;t load compliance payments.
          </p>
        ) : rows.length === 0 ? (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-dashed px-4 py-4 text-sm text-muted-foreground">
            <ReceiptTextIcon className="size-4 shrink-0" />
            No compliance payments logged yet.
          </div>
        ) : (
          <ul className="mt-3 divide-y">
            {rows.slice(0, 6).map((payment) => (
              <li
                key={payment.payment_id}
                className="flex items-start justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {payment.payment_type}
                    {payment.reference ? (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · {payment.reference}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(payment.paid_on)}
                    {payment.notes ? ` · ${payment.notes}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(Number(payment.amount_kes))}
                  </span>
                  {canManage ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-full text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${payment.payment_type} payment`}
                      onClick={() => setToDelete(payment)}
                    >
                      {remove.isPending &&
                      remove.variables === payment.payment_id ? (
                        <Loader2Icon className="animate-spin" />
                      ) : (
                        <Trash2Icon />
                      )}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}

        {lastPayment ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Last payment {formatDate(lastPayment.paid_on)} ·{" "}
            {formatCurrency(Number(lastPayment.amount_kes))}
          </p>
        ) : null}
      </div>

      {canManage ? (
        <p className="text-xs text-muted-foreground">
          Update land rent, rates and gazette status from Edit property. Logged
          payments are kept as a dated history.
        </p>
      ) : null}

      <PropertyPaymentDialog
        open={dialog === "payment"}
        onOpenChange={(open) => setDialog(open ? "payment" : null)}
        propertyId={property.property_id}
        propertyAlias={property.alias}
      />

      <AlertDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => {
          if (!open) setToDelete(undefined)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this payment?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete
                ? `${toDelete.payment_type} · ${formatCurrency(
                    Number(toDelete.amount_kes)
                  )} · ${formatDate(toDelete.paid_on)}`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={remove.isPending}
              onClick={(event) => {
                event.preventDefault()
                if (toDelete) remove.mutate(toDelete.payment_id)
              }}
            >
              {remove.isPending && <Loader2Icon className="animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
