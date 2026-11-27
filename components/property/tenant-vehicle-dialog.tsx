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
import { createTenantVehicle, propertyKeys } from "@/lib/api/properties"

const inputClass = "h-11 rounded-xl px-3.5"
const labelClass =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"

export function TenantVehicleDialog({
  open,
  onOpenChange,
  tenantId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-x-hidden p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Add vehicle
          </DialogTitle>
          <DialogDescription>
            Register a vehicle kept by this tenant.
          </DialogDescription>
        </DialogHeader>
        <VehicleForm
          tenantId={tenantId}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function VehicleForm({
  tenantId,
  onDone,
}: {
  tenantId: string
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const [make, setMake] = useState("")
  const [model, setModel] = useState("")
  const [registration, setRegistration] = useState("")
  const [colour, setColour] = useState("")
  const [notes, setNotes] = useState("")

  const mutation = useMutation({
    mutationFn: () =>
      createTenantVehicle(tenantId, {
        make: make.trim(),
        model: model || undefined,
        registration_number: registration.trim(),
        colour: colour || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Vehicle added")
      onDone()
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't add the vehicle.")),
  })

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!make.trim()) {
      toast.error("Enter the vehicle make.")
      return
    }
    if (!registration.trim()) {
      toast.error("Enter the registration number.")
      return
    }
    mutation.mutate()
  }

  return (
    <form onSubmit={submit} noValidate>
      <fieldset disabled={mutation.isPending} className="grid gap-4 px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="vehicle-make" className={labelClass}>
              Make
            </FieldLabel>
            <Input
              id="vehicle-make"
              placeholder="Toyota"
              className={inputClass}
              value={make}
              onChange={(event) => setMake(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="vehicle-model" className={labelClass}>
              Model
            </FieldLabel>
            <Input
              id="vehicle-model"
              placeholder="Axio"
              className={inputClass}
              value={model}
              onChange={(event) => setModel(event.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="vehicle-reg" className={labelClass}>
              Registration number
            </FieldLabel>
            <Input
              id="vehicle-reg"
              placeholder="KDG 123A"
              className={inputClass}
              value={registration}
              onChange={(event) => setRegistration(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="vehicle-colour" className={labelClass}>
              Colour
            </FieldLabel>
            <Input
              id="vehicle-colour"
              placeholder="White"
              className={inputClass}
              value={colour}
              onChange={(event) => setColour(event.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-2">
          <FieldLabel htmlFor="vehicle-notes" className={labelClass}>
            Notes
          </FieldLabel>
          <Textarea
            id="vehicle-notes"
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
          className="h-10 rounded-xl bg-emerald-800 px-5 text-white hover:bg-emerald-900"
          disabled={mutation.isPending}
        >
          {mutation.isPending && <Loader2Icon className="animate-spin" />}
          Add vehicle
        </Button>
      </DialogFooter>
    </form>
  )
}
