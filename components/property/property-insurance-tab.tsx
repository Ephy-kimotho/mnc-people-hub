"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon, PlusIcon, ShieldCheckIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { InsuranceDialog } from "@/components/property/property-record-dialogs"
import { useInsurance } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import { deleteInsurance, propertyKeys } from "@/lib/api/properties"
import { formatCurrency, formatDate } from "@/lib/format"

const statusTone: Record<string, string> = {
  Active:
    "border-emerald-700/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  Expired: "border-border bg-muted text-muted-foreground",
  Cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
}

export function PropertyInsuranceTab({
  propertyId,
  canManage,
}: {
  propertyId: string
  canManage: boolean
}) {
  const queryClient = useQueryClient()
  const query = useInsurance(propertyId)
  const [open, setOpen] = useState(false)

  const remove = useMutation({
    mutationFn: (id: string) => deleteInsurance(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Policy deleted")
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't delete the policy.")),
  })

  return (
    <div className="space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">
            Property insurance
          </h2>
          <p className="text-sm text-muted-foreground">
            Policies kept with this property rather than in the operations log.
          </p>
        </div>
        {canManage ? (
          <Button
            className="h-9 rounded-full bg-emerald-800 px-4 text-white hover:bg-emerald-900"
            onClick={() => setOpen(true)}
          >
            <PlusIcon />
            Add Policy
          </Button>
        ) : null}
      </div>

      {query.isPending ? (
        <Skeleton className="h-24 rounded-2xl" />
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(query.error, "Couldn't load insurance.")}
        </p>
      ) : (query.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          <ShieldCheckIcon className="size-5 text-emerald-800" />
          <p className="font-medium text-foreground">
            No insurance policy recorded
          </p>
          <p>
            Add building, fire, liability, contents, or another policy type.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(query.data ?? []).map((policy) => (
            <Card key={policy.policy_id} className="gap-3 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-heading text-base font-semibold">
                    {policy.insurance_type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {policy.insurer || "Insurer not recorded"}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`rounded-full ${statusTone[policy.status] ?? ""}`}
                >
                  {policy.status}
                </Badge>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Policy number" value={policy.policy_number} />
                <Field
                  label="Premium"
                  value={
                    policy.premium_kes != null
                      ? formatCurrency(policy.premium_kes)
                      : null
                  }
                />
                <Field
                  label="Valid from"
                  value={
                    policy.valid_from ? formatDate(policy.valid_from) : null
                  }
                />
                <Field
                  label="Valid until"
                  value={
                    policy.valid_until ? formatDate(policy.valid_until) : null
                  }
                />
              </dl>
              {policy.notes ? (
                <p className="text-sm text-muted-foreground">{policy.notes}</p>
              ) : null}
              {canManage ? (
                <div className="border-t pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-destructive"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(policy.policy_id)}
                  >
                    {remove.isPending ? (
                      <Loader2Icon className="animate-spin" />
                    ) : (
                      <Trash2Icon />
                    )}
                    Delete
                  </Button>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <InsuranceDialog
        open={open}
        onOpenChange={setOpen}
        propertyId={propertyId}
      />
    </div>
  )
}

function Field({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div>
      <dt className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium">{value || "—"}</dd>
    </div>
  )
}
