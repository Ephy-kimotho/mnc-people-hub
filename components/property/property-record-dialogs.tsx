"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon, UploadCloudIcon } from "lucide-react"
import { useRef, useState } from "react"
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
import {
  createContact,
  createInsurance,
  createOwner,
  propertyKeys,
  uploadPropertyDocument,
} from "@/lib/api/properties"

const inputClass = "h-11 rounded-xl px-3.5"
const labelClass =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"

const documentCategories = ["Title Deed", "Insurance", "Site Map", "Other"]
const insuranceTypes = ["Building", "Fire", "Liability", "Contents", "Other"]
const insuranceStatuses = ["Active", "Expired", "Cancelled"]
const entityTypes = ["Individual", "Company", "Trust"]
const contactRoles = [
  "Security / Caretaker",
  "Property Manager",
  "Caretaker",
  "Other",
]

export function PropertyDocumentDialog({
  open,
  onOpenChange,
  propertyId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyId: string
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [category, setCategory] = useState("Title Deed")
  const [file, setFile] = useState<File>()
  const fileInput = useRef<HTMLInputElement>(null)

  const mutation = useMutation({
    mutationFn: () =>
      uploadPropertyDocument(propertyId, {
        name: name.trim() || file?.name || "Document",
        category,
        file: file as File,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Document uploaded")
      setName("")
      setFile(undefined)
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't upload the document.")),
  })

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0]
    if (!picked) return
    if (
      !["application/pdf", "image/jpeg", "image/png"].includes(picked.type)
    ) {
      toast.error("Choose a PDF, JPEG or PNG file.")
      return
    }
    setFile(picked)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-x-hidden p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Upload property document
          </DialogTitle>
          <DialogDescription>
            Title deeds, insurance copies, site maps and other records.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 px-6 py-5">
          <div className="grid gap-2">
            <FieldLabel htmlFor="doc-name" className={labelClass}>
              Document name
            </FieldLabel>
            <Input
              id="doc-name"
              placeholder="e.g. Title Deed 2026"
              className={inputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="doc-category" className={labelClass}>
              Category
            </FieldLabel>
            <select
              id="doc-category"
              className={inputClass}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {documentCategories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-6 text-center transition-colors hover:bg-muted/40"
          >
            <UploadCloudIcon className="size-6 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">Click to upload</span> a PDF or image
            </span>
            {file ? (
              <span className="text-xs font-medium text-emerald-800">
                {file.name}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                PDF, JPEG, PNG up to 15 MB
              </span>
            )}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,image/jpeg,image/png"
            className="hidden"
            onChange={onPick}
          />
        </div>
        <DialogFooter className="border-t px-6 py-4">
          <Button
            variant="outline"
            className="h-10 rounded-xl px-5"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            className="h-10 rounded-xl bg-emerald-800 px-5 text-white hover:bg-emerald-900"
            disabled={mutation.isPending || !file}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending && <Loader2Icon className="animate-spin" />}
            Upload document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function InsuranceDialog({
  open,
  onOpenChange,
  propertyId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyId: string
}) {
  const queryClient = useQueryClient()
  const [type, setType] = useState("Building")
  const [insurer, setInsurer] = useState("")
  const [policyNumber, setPolicyNumber] = useState("")
  const [premium, setPremium] = useState("")
  const [validFrom, setValidFrom] = useState("")
  const [validUntil, setValidUntil] = useState("")
  const [status, setStatus] = useState("Active")
  const [notes, setNotes] = useState("")

  const mutation = useMutation({
    mutationFn: () =>
      createInsurance(propertyId, {
        insurance_type: type,
        insurer: insurer || undefined,
        policy_number: policyNumber || undefined,
        premium_kes: premium ? Number(premium) : undefined,
        valid_from: validFrom || undefined,
        valid_until: validUntil || undefined,
        status,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Insurance policy added")
      setInsurer("")
      setPolicyNumber("")
      setPremium("")
      setValidFrom("")
      setValidUntil("")
      setNotes("")
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't save the policy.")),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-x-hidden p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Add insurance policy
          </DialogTitle>
          <DialogDescription>
            Record the cover attached to this property.
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[65vh] gap-4 overflow-x-hidden overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <FieldLabel htmlFor="ins-type" className={labelClass}>
                Insurance type
              </FieldLabel>
              <select
                id="ins-type"
                className={inputClass}
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                {insuranceTypes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="ins-status" className={labelClass}>
                Status
              </FieldLabel>
              <select
                id="ins-status"
                className={inputClass}
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {insuranceStatuses.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="ins-insurer" className={labelClass}>
              Insurer
            </FieldLabel>
            <Input
              id="ins-insurer"
              className={inputClass}
              placeholder="e.g. Jubilee Insurance"
              value={insurer}
              onChange={(event) => setInsurer(event.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <FieldLabel htmlFor="ins-policy" className={labelClass}>
                Policy number
              </FieldLabel>
              <Input
                id="ins-policy"
                className={inputClass}
                value={policyNumber}
                onChange={(event) => setPolicyNumber(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="ins-premium" className={labelClass}>
                Premium (KES)
              </FieldLabel>
              <Input
                id="ins-premium"
                type="number"
                min="0"
                className={inputClass}
                value={premium}
                onChange={(event) => setPremium(event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <FieldLabel htmlFor="ins-from" className={labelClass}>
                Valid from
              </FieldLabel>
              <Input
                id="ins-from"
                type="date"
                className={inputClass}
                value={validFrom}
                onChange={(event) => setValidFrom(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="ins-until" className={labelClass}>
                Valid until
              </FieldLabel>
              <Input
                id="ins-until"
                type="date"
                className={inputClass}
                value={validUntil}
                onChange={(event) => setValidUntil(event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="ins-notes" className={labelClass}>
              Notes
            </FieldLabel>
            <Textarea
              id="ins-notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="border-t px-6 py-4">
          <Button
            variant="outline"
            className="h-10 rounded-xl px-5"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            className="h-10 rounded-xl bg-emerald-800 px-5 text-white hover:bg-emerald-900"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending && <Loader2Icon className="animate-spin" />}
            Save policy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function OwnerDialog({
  open,
  onOpenChange,
  propertyId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyId: string
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [entityType, setEntityType] = useState("Company")
  const [share, setShare] = useState("100")

  const mutation = useMutation({
    mutationFn: () =>
      createOwner(propertyId, {
        name: name.trim(),
        entity_type: entityType,
        share_pct: Number(share) || 0,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Owner added")
      setName("")
      setShare("100")
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't add the owner.")),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-x-hidden p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Add owner
          </DialogTitle>
          <DialogDescription>
            Who holds this property, and what share.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 px-6 py-5">
          <div className="grid gap-2">
            <FieldLabel htmlFor="owner-name" className={labelClass}>
              Owner name
            </FieldLabel>
            <Input
              id="owner-name"
              className={inputClass}
              placeholder="e.g. Marigu Investments Limited"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <FieldLabel htmlFor="owner-type" className={labelClass}>
                Entity type
              </FieldLabel>
              <select
                id="owner-type"
                className={inputClass}
                value={entityType}
                onChange={(event) => setEntityType(event.target.value)}
              >
                {entityTypes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="owner-share" className={labelClass}>
                Share (%)
              </FieldLabel>
              <Input
                id="owner-share"
                type="number"
                min="0"
                max="100"
                className={inputClass}
                value={share}
                onChange={(event) => setShare(event.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="border-t px-6 py-4">
          <Button
            variant="outline"
            className="h-10 rounded-xl px-5"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            className="h-10 rounded-xl bg-emerald-800 px-5 text-white hover:bg-emerald-900"
            disabled={mutation.isPending || !name.trim()}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending && <Loader2Icon className="animate-spin" />}
            Add owner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ContactDialog({
  open,
  onOpenChange,
  propertyId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyId: string
}) {
  const queryClient = useQueryClient()
  const [role, setRole] = useState("Security / Caretaker")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [primary, setPrimary] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      createContact(propertyId, {
        role,
        name: name.trim(),
        phone: phone || undefined,
        is_primary: primary,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      toast.success("Contact added")
      setName("")
      setPhone("")
      setPrimary(false)
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't add the contact.")),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-x-hidden p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Add key contact
          </DialogTitle>
          <DialogDescription>
            Security, caretaker, property manager or another contact.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 px-6 py-5">
          <div className="grid gap-2">
            <FieldLabel htmlFor="contact-role" className={labelClass}>
              Role
            </FieldLabel>
            <select
              id="contact-role"
              className={inputClass}
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              {contactRoles.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="contact-name" className={labelClass}>
              Name
            </FieldLabel>
            <Input
              id="contact-name"
              className={inputClass}
              placeholder="Full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="contact-phone" className={labelClass}>
              Phone
            </FieldLabel>
            <Input
              id="contact-phone"
              className={inputClass}
              placeholder="+254…"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={primary}
              onChange={(event) => setPrimary(event.target.checked)}
            />
            Primary contact
          </label>
        </div>
        <DialogFooter className="border-t px-6 py-4">
          <Button
            variant="outline"
            className="h-10 rounded-xl px-5"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            className="h-10 rounded-xl bg-emerald-800 px-5 text-white hover:bg-emerald-900"
            disabled={mutation.isPending || !name.trim()}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending && <Loader2Icon className="animate-spin" />}
            Add contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
