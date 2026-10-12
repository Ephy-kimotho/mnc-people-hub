"use client"

import { MapPinIcon, PlusIcon, SearchIcon } from "lucide-react"
import { useState } from "react"

import { PageHeader } from "@/components/dashboard/page-header"
import { AddStaffDialog } from "@/components/staff/add-staff-dialog"
import { DeleteStaffDialog } from "@/components/staff/delete-staff-dialog"
import { LocationPill, StaffAvatar } from "@/components/staff/staff-bits"
import { StaffDetailsDialog } from "@/components/staff/staff-details-dialog"
import { StaffRowActions } from "@/components/staff/staff-row-actions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate } from "@/lib/format"
import type { StaffValues } from "@/lib/schemas/staff"
import type { Location, Staff } from "@/lib/types"
import { cn } from "@/lib/utils"

export type StaffMember = Staff & { leaveTaken: number }

type DialogKind = "add" | "details" | "delete"

// Shared by header and rows so columns line up once the card is wide enough
const columns =
  "@3xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.8fr)_3rem] @3xl:gap-x-4"

// Changes live in local state until there's a backend to save to
export function StaffDirectory({
  initialStaff,
  locations,
}: {
  initialStaff: StaffMember[]
  locations: Location[]
}) {
  const [staff, setStaff] = useState(initialStaff)
  const [search, setSearch] = useState("")
  const [locationFilter, setLocationFilter] = useState("all")
  const [openDialog, setOpenDialog] = useState<DialogKind | null>(null)
  const [selected, setSelected] = useState<StaffMember>()

  const locationIndex = (id: string) => locations.findIndex((l) => l.id === id)
  const locationName = (id: string) => locations[locationIndex(id)]?.name ?? "—"

  const query = search.trim().toLowerCase()
  const visible = staff
    .filter((s) => locationFilter === "all" || s.locationId === locationFilter)
    .filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.role.toLowerCase().includes(query)
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  function open(kind: DialogKind, member?: StaffMember) {
    setSelected(member)
    setOpenDialog(kind)
  }

  function closeDialog(isOpen: boolean) {
    if (!isOpen) setOpenDialog(null)
  }

  function addStaff(values: StaffValues) {
    const member: StaffMember = {
      ...values,
      id: crypto.randomUUID(),
      email: values.email || undefined,
      phone: values.phone || undefined,
      leaveTaken: 0,
    }
    setStaff((prev) => [...prev, member])
    setOpenDialog(null)
  }

  function deleteSelected() {
    setStaff((prev) => prev.filter((s) => s.id !== selected?.id))
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Your team"
        title="Staff Directory"
        description="Manage your household team members"
        action={
          <Button
            className="h-10 self-start rounded-full px-5"
            onClick={() => open("add")}
          >
            <PlusIcon />
            Add Staff Member
          </Button>
        }
      />

      <Card className="@container gap-0 rounded-2xl py-0 shadow-xs">
        <div className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1 sm:max-w-md">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or role..."
              aria-label="Search staff"
              className="h-11 rounded-xl pl-10"
            />
          </div>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger
              aria-label="Filter by location"
              className="h-11 w-full rounded-xl px-3.5 data-[size=default]:h-11 *:data-[slot=select-value]:flex-1 sm:w-60"
            >
              <MapPinIcon className="text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div
          className={cn(
            "hidden border-y bg-muted/50 px-6 py-3 text-[0.7rem] font-medium tracking-[0.14em] text-muted-foreground uppercase @3xl:grid",
            columns
          )}
        >
          <span>Name &amp; Role</span>
          <span>Location</span>
          <span>Contact</span>
          <span>Start date</span>
          <span className="text-right">Actions</span>
        </div>

        {visible.length === 0 ? (
          <p className="border-t px-6 py-12 text-center text-sm text-muted-foreground @3xl:border-t-0">
            {staff.length === 0
              ? "No staff yet. Add your first team member."
              : "No staff match your search."}
          </p>
        ) : (
          <ul className="divide-y border-t @3xl:border-t-0">
            {visible.map((member) => (
              <li
                key={member.id}
                className={cn(
                  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-4 py-4 @3xl:px-6",
                  columns
                )}
              >
                <div className="flex items-center gap-3">
                  <StaffAvatar name={member.name} />
                  <div className="min-w-0">
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.role}
                    </p>
                  </div>
                </div>

                {/* Actions sit beside the name on mobile and move last on wide cards */}
                <div className="justify-self-end @3xl:order-last">
                  <StaffRowActions
                    name={member.name}
                    onView={() => open("details", member)}
                    onDelete={() => open("delete", member)}
                  />
                </div>

                <div className="hidden @3xl:block">
                  <LocationPill
                    name={locationName(member.locationId)}
                    index={locationIndex(member.locationId)}
                  />
                </div>
                <div className="hidden min-w-0 text-sm @3xl:block">
                  <p>{member.phone ?? "—"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.email ?? "—"}
                  </p>
                </div>
                <p className="hidden text-sm @3xl:block">
                  {formatDate(member.startDate)}
                </p>

                {/* Narrow cards fold location, contact and start date below the name */}
                <div className="col-span-full flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground @3xl:hidden">
                  <LocationPill
                    name={locationName(member.locationId)}
                    index={locationIndex(member.locationId)}
                  />
                  {member.phone && <span>{member.phone}</span>}
                  <span>Since {formatDate(member.startDate)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AddStaffDialog
        open={openDialog === "add"}
        onOpenChange={closeDialog}
        locations={locations}
        onSave={addStaff}
      />
      <StaffDetailsDialog
        open={openDialog === "details"}
        onOpenChange={closeDialog}
        staff={selected}
        locationName={selected && locationName(selected.locationId)}
      />
      <DeleteStaffDialog
        open={openDialog === "delete"}
        onOpenChange={closeDialog}
        name={selected?.name}
        onConfirm={deleteSelected}
      />
    </div>
  )
}
