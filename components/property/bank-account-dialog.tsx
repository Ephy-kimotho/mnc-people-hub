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
import { getErrorMessage } from "@/lib/api/errors"
import {
  createBankAccount,
  propertyKeys,
  updateBankAccount,
} from "@/lib/api/properties"
import { bankAccountSchema, type BankAccountInput } from "@/lib/schemas/property"
import type { BankAccount } from "@/lib/types"

const inputClass = "h-11 rounded-xl px-3.5"
const labelClass =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"

export function BankAccountDialog({
  open,
  onOpenChange,
  account,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: BankAccount
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            {account ? "Edit bank account" : "Add bank account"}
          </DialogTitle>
          <DialogDescription>
            Accounts used for rent routing and service charges.
          </DialogDescription>
        </DialogHeader>
        <BankForm account={account} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function BankForm({
  account,
  onDone,
}: {
  account?: BankAccount
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const form = useForm<
    z.input<typeof bankAccountSchema>,
    unknown,
    BankAccountInput
  >({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      bank_name: account?.bank_name ?? "",
      account_name: account?.account_name ?? "",
      branch: account?.branch ?? "",
      account_number: account?.account_number ?? "",
      currency: account?.currency ?? "KES",
      relationship_manager: account?.relationship_manager ?? "",
      contact: account?.contact ?? "",
    },
  })

  const mutation = useMutation({
    mutationFn: (values: BankAccountInput) =>
      account
        ? updateBankAccount(account.account_id, values)
        : createBankAccount(values),
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success(`${values.bank_name} account saved`)
      onDone()
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't save the bank account.")),
  })

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      noValidate
    >
      <fieldset disabled={mutation.isPending} className="grid gap-4 px-6 py-5">
        <div className="grid gap-2">
          <FieldLabel htmlFor="bank-name" className={labelClass}>
            Bank
          </FieldLabel>
          <Input
            id="bank-name"
            placeholder="NCBA"
            className={inputClass}
            {...form.register("bank_name")}
          />
          <FieldError>{form.formState.errors.bank_name?.message}</FieldError>
        </div>
        <div className="grid gap-2">
          <FieldLabel htmlFor="bank-account-name" className={labelClass}>
            Account name
          </FieldLabel>
          <Input
            id="bank-account-name"
            placeholder="Manga Capital Ltd"
            className={inputClass}
            {...form.register("account_name")}
          />
          <FieldError>
            {form.formState.errors.account_name?.message}
          </FieldError>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="bank-branch" className={labelClass}>
              Branch
            </FieldLabel>
            <Input
              id="bank-branch"
              className={inputClass}
              {...form.register("branch")}
            />
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="bank-number" className={labelClass}>
              Account number
            </FieldLabel>
            <Input
              id="bank-number"
              className={inputClass}
              {...form.register("account_number")}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="bank-currency" className={labelClass}>
              Currency
            </FieldLabel>
            <select
              id="bank-currency"
              className={inputClass}
              {...form.register("currency")}
            >
              <option value="KES">KES</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="bank-contact" className={labelClass}>
              Contact
            </FieldLabel>
            <Input
              id="bank-contact"
              className={inputClass}
              {...form.register("contact")}
            />
          </div>
        </div>
        <div className="grid gap-2">
          <FieldLabel htmlFor="bank-manager" className={labelClass}>
            Relationship manager
          </FieldLabel>
          <Input
            id="bank-manager"
            className={inputClass}
            {...form.register("relationship_manager")}
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
          Save account
        </Button>
      </DialogFooter>
    </form>
  )
}
