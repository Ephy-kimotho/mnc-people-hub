"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Building2Icon, Loader2Icon, PlusIcon } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

import { AssignStaffDialog } from "@/components/staff-profile/assign-staff-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import { useStaffAssignments } from "@/hooks/use-staff"
import { getErrorMessage } from "@/lib/api/errors"
import { deleteStaffAssignment, staffKeys } from "@/lib/api/staff"
import { formatDate } from "@/lib/format"
import { canManageStaff, canReviewLeave } from "@/lib/permissions"
import type { PropertyAssignment, StaffMember } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

export function AssignmentsCard({ staff }: { staff: StaffMember }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const query = useStaffAssignments(staff.staff_id)
  const [open, setOpen] = useState(false)
  const [removing, setRemoving] = useState<PropertyAssignment>()

  const remove = useMutation({
    mutationFn: (assignmentId: string) =>
      deleteStaffAssignment(staff.staff_id, assignmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: staffKeys.assignments(staff.staff_id),
      })
      void queryClient.invalidateQueries({ queryKey: staffKeys.all })
      toast.success("Assignment removed")
      setRemoving(undefined)
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't remove the assignment.")),
  })

  // Staff can't see this card; managers can view, admins can change it
  if (!canReviewLeave(user)) return null
  const canManage = canManageStaff(user)

  return (
    <Card className="gap-4 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">
            Property assignments
          </h2>
          <p className="text-sm text-muted-foreground">
            Where {staff.full_name.split(" ")[0]} works.
          </p>
        </div>
        {canManage ? (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setOpen(true)}
          >
            <PlusIcon />
            Assign
          </Button>
        ) : null}
      </div>

      {query.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(query.error, "Couldn't load assignments.")}
        </p>
      ) : (query.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
          <Building2Icon className="size-5 text-brand-ink" />
          No property assignment yet.
        </div>
      ) : (
        <ul className="divide-y">
          {(query.data ?? []).map((assignment) => (
            <li
              key={assignment.assignment_id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
            >
              <div>
                <p className="font-medium">{assignment.property_alias}</p>
                <p className="text-sm text-muted-foreground">
                  {assignment.role_at_property || "Staff"} · from{" "}
                  {formatDate(assignment.assigned_from)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {assignment.is_current ? (
                  <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
                    Current
                  </span>
                ) : null}
                {canManage ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-destructive"
                    onClick={() => setRemoving(assignment)}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <AssignStaffDialog
        open={open}
        onOpenChange={setOpen}
        staffId={staff.staff_id}
        staffName={staff.full_name}
      />

      <AlertDialog
        open={Boolean(removing)}
        onOpenChange={(next) => !next && setRemoving(undefined)}
      >
        <AlertDialogContent className="rounded-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              Remove {removing?.property_alias} assignment?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {staff.full_name} will no longer be assigned to this property.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="-mx-6 -mb-6 px-6">
            <AlertDialogCancel className="h-10 rounded-xl px-5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                if (removing) remove.mutate(removing.assignment_id)
              }}
              disabled={remove.isPending}
              variant="destructive"
              className="h-10 rounded-xl px-5"
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
