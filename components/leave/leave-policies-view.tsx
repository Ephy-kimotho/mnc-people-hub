"use client"

import { FileTextIcon, PencilIcon } from "lucide-react"
import { useState } from "react"

import { PageHeader } from "@/components/dashboard/page-header"
import { LeavePolicyDialog } from "@/components/leave/leave-policy-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useLeavePolicies } from "@/hooks/use-extras"
import { getErrorMessage } from "@/lib/api/errors"
import type { LeavePolicy } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

export function LeavePoliciesView() {
  const { user } = useAuth()
  const canEdit = user?.role === "admin"
  const query = useLeavePolicies()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<LeavePolicy>()

  function edit(policy: LeavePolicy) {
    setEditing(policy)
    setOpen(true)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Entitlements"
        title="Leave policies"
        description="Days, carry-over and document rules for each leave type."
      />

      {query.isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(query.error, "Couldn't load leave policies.")}
        </p>
      ) : (query.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          <FileTextIcon className="size-5 text-brand-ink" />
          No policies configured.
        </div>
      ) : (
        <Card className="gap-0 rounded-2xl p-0">
          <ul className="divide-y">
            {(query.data ?? []).map((policy) => (
              <li
                key={policy.policy_id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="font-medium">{policy.leave_type}</p>
                  <p className="text-sm text-muted-foreground">
                    {policy.description || "No description"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {policy.entitlement_days} days
                  </Badge>
                  {policy.paid ? <Badge variant="secondary">Paid</Badge> : null}
                  {policy.carry_over ? (
                    <Badge variant="outline">Carry over</Badge>
                  ) : null}
                  {policy.requires_docs ? (
                    <Badge variant="outline">Docs required</Badge>
                  ) : null}
                  {canEdit ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      onClick={() => edit(policy)}
                    >
                      <PencilIcon />
                      Edit
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <LeavePolicyDialog
        open={open}
        onOpenChange={setOpen}
        policy={editing}
      />
    </div>
  )
}
