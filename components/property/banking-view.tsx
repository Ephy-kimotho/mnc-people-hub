"use client"

import { format } from "date-fns"
import { EllipsisVerticalIcon, LandmarkIcon, PlusIcon } from "lucide-react"
import { useState } from "react"

import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { BankAccountDialog } from "@/components/property/bank-account-dialog"
import { DeleteBankAccountDialog } from "@/components/property/delete-bank-account-dialog"
import { RentPaymentDialog } from "@/components/property/rent-payment-dialog"
import { useBankAccounts, useRentCollection } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import { formatCurrency } from "@/lib/format"
import { canManageProperty } from "@/lib/permissions"
import type { BankAccount, RentCollection } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

function maskAccount(number: string | null) {
  if (!number) return "—"
  const digits = number.replace(/\s+/g, "")
  if (digits.length <= 4) return digits
  return `•••• ${digits.slice(-4)}`
}

export function BankingView() {
  const { user } = useAuth()
  const canManage = canManageProperty(user)
  const accounts = useBankAccounts()
  const [period, setPeriod] = useState(format(new Date(), "yyyy-MM"))
  const rent = useRentCollection(period)
  const [dialog, setDialog] = useState<"bank" | "delete" | null>(null)
  const [selected, setSelected] = useState<BankAccount>()
  const [payment, setPayment] = useState<RentCollection>()

  function open(kind: "bank" | "delete", account?: BankAccount) {
    setSelected(account)
    setDialog(kind)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Money in and out"
        title="Banking"
        description="Accounts, rent collection and what is still outstanding."
      />

      <Card className="gap-0 rounded-2xl p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2 className="font-heading text-lg font-semibold">Bank accounts</h2>
            <p className="text-sm text-muted-foreground">
              Used for rent routing and service charges.
            </p>
          </div>
          {canManage ? (
            <Button
              className="h-9 rounded-full px-4"
              onClick={() => open("bank")}
            >
              <PlusIcon />
              Add account
            </Button>
          ) : null}
        </div>

        {accounts.isPending ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">Loading…</p>
        ) : accounts.isError ? (
          <p className="px-5 py-8 text-sm text-destructive">
            {getErrorMessage(accounts.error, "Couldn't load bank accounts.")}
          </p>
        ) : (accounts.data ?? []).length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-sm text-muted-foreground">
            <LandmarkIcon className="size-5 text-brand-ink" />
            No bank accounts yet.
          </div>
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {(accounts.data ?? []).map((account) => (
              <div
                key={account.account_id}
                className="rounded-xl border px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{account.bank_name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {account.account_name}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Badge variant="outline">{account.currency}</Badge>
                    {canManage ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-full"
                          >
                            <EllipsisVerticalIcon />
                            <span className="sr-only">Account actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onSelect={() => open("bank", account)}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => open("delete", account)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-[0.6rem] font-semibold tracking-wide text-muted-foreground uppercase">
                      Account
                    </dt>
                    <dd>{maskAccount(account.account_number)}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.6rem] font-semibold tracking-wide text-muted-foreground uppercase">
                      Branch
                    </dt>
                    <dd>{account.branch || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.6rem] font-semibold tracking-wide text-muted-foreground uppercase">
                      Manager
                    </dt>
                    <dd>{account.relationship_manager || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.6rem] font-semibold tracking-wide text-muted-foreground uppercase">
                      Contact
                    </dt>
                    <dd className="truncate">{account.contact || "—"}</dd>
                  </div>
                </dl>

                <p className="mt-3 border-t pt-2 text-xs text-muted-foreground">
                  {account.assigned_leases ?? 0}{" "}
                  {(account.assigned_leases ?? 0) === 1 ? "lease" : "leases"}{" "}
                  assigned
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="gap-0 rounded-2xl p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2 className="font-heading text-lg font-semibold">
              Rent collection
            </h2>
            <p className="text-sm text-muted-foreground">
              Expected against paid for each active lease.
            </p>
          </div>
          <Input
            type="month"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="h-10 w-44 rounded-xl"
            aria-label="Rent period"
          />
        </div>

        {rent.isPending ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">Loading…</p>
        ) : rent.isError ? (
          <p className="px-5 py-8 text-sm text-destructive">
            {getErrorMessage(rent.error, "Couldn't load rent collection.")}
          </p>
        ) : (rent.data ?? []).length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No active leases for this period.
          </p>
        ) : (
          <ul className="divide-y">
            {(rent.data ?? []).map((row) => {
              const expected = row.expected_kes ?? 0
              const unconfigured = expected <= 0
              const outstanding = Math.max(
                0,
                expected - (row.paid_kes ?? 0)
              )
              return (
                <li
                  key={row.lease_id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div>
                    <p className="font-medium">
                      {row.tenant_full_name ||
                        row.tenant_company_name ||
                        "Tenant"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {row.property_alias} · {row.unit_label}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatCurrency(row.paid_kes)} paid
                      </p>
                      <p className="text-xs text-muted-foreground">
                        of {formatCurrency(row.expected_kes ?? 0)}
                      </p>
                    </div>
                    {unconfigured ? (
                      <Badge variant="outline">Unconfigured</Badge>
                    ) : outstanding > 0 ? (
                      <Badge variant="outline" className="text-warning">
                        {formatCurrency(outstanding)} due
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Paid</Badge>
                    )}
                    {canManage ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => setPayment(row)}
                      >
                        Record
                      </Button>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <BankAccountDialog
        open={dialog === "bank"}
        onOpenChange={(next) => !next && setDialog(null)}
        account={selected}
      />
      <DeleteBankAccountDialog
        open={dialog === "delete"}
        onOpenChange={(next) => !next && setDialog(null)}
        account={selected}
      />
      <RentPaymentDialog
        open={Boolean(payment)}
        onOpenChange={(next) => !next && setPayment(undefined)}
        row={payment}
        period={period}
      />
    </div>
  )
}
