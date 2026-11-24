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
import { FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useProperties } from "@/hooks/use-properties"
import { getErrorMessage } from "@/lib/api/errors"
import { createStaffAssignment, staffKeys } from "@/lib/api/staff"
import { formatISODate } from "@/lib/format"

const inputClass = "h-11 rounded-xl px-3.5"
const labelClass =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"

export function AssignStaffDialog({
  open,
  onOpenChange,
  staffId,
  staffName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  staffId: string
  staffName: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Assign {staffName} to a property
          </DialogTitle>
          <DialogDescription>
            This becomes their current property assignment.
          </DialogDescription>
        </DialogHeader>
        <AssignForm
          staffId={staffId}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function AssignForm({
  staffId,
  onDone,
}: {
  staffId: string
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const properties = useProperties()
  const [propertyId, setPropertyId] = useState("")
  const [role, setRole] = useState("")
  const [startDate, setStartDate] = useState(formatISODate(new Date()))
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      const property = (properties.data ?? []).find(
        (item) => item.property_id === propertyId
      )
      if (!property) throw new Error("Choose a property.")
      return createStaffAssignment(staffId, {
        property_id: propertyId,
        property_alias: property.alias,
        role_at_property: role || undefined,
        assigned_from: startDate || undefined,
        notes: notes || undefined,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: staffKeys.assignments(staffId),
      })
      void queryClient.invalidateQueries({ queryKey: staffKeys.all })
      toast.success("Property assignment added")
      onDone()
    },
    onError: (err) =>
      setError(getErrorMessage(err, "Couldn't assign this staff member.")),
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        if (!propertyId) {
          setError("Choose a property.")
          return
        }
        mutation.mutate()
      }}
      noValidate
    >
      <fieldset disabled={mutation.isPending} className="grid gap-4 px-6 py-5">
        <div className="grid gap-2">
          <FieldLabel htmlFor="assign-property" className={labelClass}>
            Property
          </FieldLabel>
          <select
            id="assign-property"
            className={inputClass}
            value={propertyId}
            onChange={(event) => setPropertyId(event.target.value)}
          >
            <option value="">Choose a property</option>
            {(properties.data ?? []).map((property) => (
              <option key={property.property_id} value={property.property_id}>
                {property.alias}
              </option>
            ))}
          </select>
          <FieldError>{error}</FieldError>
        </div>
        <div className="grid gap-2">
          <FieldLabel htmlFor="assign-role" className={labelClass}>
            Role at property
          </FieldLabel>
          <Input
            id="assign-role"
            placeholder="Caretaker"
            className={inputClass}
            value={role}
            onChange={(event) => setRole(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <FieldLabel className={labelClass}>Assigned from</FieldLabel>
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            className={inputClass}
          />
        </div>
        <div className="grid gap-2">
          <FieldLabel htmlFor="assign-notes" className={labelClass}>
            Notes
          </FieldLabel>
          <Textarea
            id="assign-notes"
            rows={2}
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
          Assign
        </Button>
      </DialogFooter>
    </form>
  )
}
