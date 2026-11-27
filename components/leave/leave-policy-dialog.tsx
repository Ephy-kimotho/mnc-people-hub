"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

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
import { leaveKeys, updateLeavePolicy } from "@/lib/api/leaves"
import type { LeavePolicy } from "@/lib/types"

const inputClass = "h-11 rounded-xl px-3.5"
const labelClass =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"

export function LeavePolicyDialog({
  open,
  onOpenChange,
  policy,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  policy?: LeavePolicy
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-x-hidden p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Edit {policy?.leave_type ?? "leave"} policy
          </DialogTitle>
          <DialogDescription>
            Entitlement changes apply to this year&apos;s existing balances.
          </DialogDescription>
        </DialogHeader>
        {policy ? (
          <PolicyForm policy={policy} onDone={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function PolicyForm({
  policy,
  onDone,
}: {
  policy: LeavePolicy
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const [entitlement, setEntitlement] = useState(
    String(policy.entitlement_days)
  )
  const [paid, setPaid] = useState(policy.paid)
  const [carryOver, setCarryOver] = useState(policy.carry_over)
  const [requiresDocs, setRequiresDocs] = useState(policy.requires_docs)
  const [description, setDescription] = useState(policy.description ?? "")

  const mutation = useMutation({
    mutationFn: () =>
      updateLeavePolicy(policy.policy_id, {
        entitlement_days: Number(entitlement) || 0,
        paid,
        carry_over: carryOver,
        requires_docs: requiresDocs,
        description: description.trim(),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leaveKeys.all })
      toast.success(`${policy.leave_type} policy updated`)
      onDone()
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't update the policy.")),
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate()
      }}
      noValidate
    >
      <fieldset disabled={mutation.isPending} className="grid gap-4 px-6 py-5">
        <div className="grid gap-2">
          <FieldLabel htmlFor="policy-days" className={labelClass}>
            Entitlement (days)
          </FieldLabel>
          <Input
            id="policy-days"
            type="number"
            min="0"
            step="0.5"
            className={inputClass}
            value={entitlement}
            onChange={(event) => setEntitlement(event.target.value)}
          />
        </div>

        <div className="grid gap-3">
          <Toggle
            label="Paid leave"
            checked={paid}
            onChange={setPaid}
          />
          <Toggle
            label="Carry over unused days"
            checked={carryOver}
            onChange={setCarryOver}
          />
          <Toggle
            label="Supporting document required"
            checked={requiresDocs}
            onChange={setRequiresDocs}
          />
        </div>

        <div className="grid gap-2">
          <FieldLabel htmlFor="policy-description" className={labelClass}>
            Description
          </FieldLabel>
          <Textarea
            id="policy-description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
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
          className="h-10 rounded-xl bg-emerald-800 px-5 text-white hover:bg-emerald-900"
          disabled={mutation.isPending}
        >
          {mutation.isPending && <Loader2Icon className="animate-spin" />}
          Save policy
        </Button>
      </DialogFooter>
    </form>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  )
}
