"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { MapPinIcon, PlusIcon, SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { PageHeader } from "@/components/dashboard/page-header"
import { TablePagination } from "@/components/table-pagination"
import { AddStaffDialog } from "@/components/staff/add-staff-dialog"
import { DeleteStaffDialog } from "@/components/staff/delete-staff-dialog"
import { LocationPill, StaffAvatar } from "@/components/staff/staff-bits"
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
import { Skeleton } from "@/components/ui/skeleton"
import { useLocations } from "@/hooks/use-locations"
import { usePagination } from "@/hooks/use-pagination"
import { getErrorMessage } from "@/lib/api/errors"
import { fetchStaff, staffKeys } from "@/lib/api/staff"
import { formatDate } from "@/lib/format"
import type { StaffFilters, StaffMember } from "@/lib/types"
import { cn } from "@/lib/utils"

type DialogKind = "add" | "delete"

// Shared by header and rows so columns line up once the card is wide enough
const columns =
  "@3xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.8fr)_3rem] @3xl:gap-x-4"

export function StaffDirectory() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [locationFilter, setLocationFilter] = useState("all")
  const [openDialog, setOpenDialog] = useState<DialogKind | null>(null)
  const [selected, setSelected] = useState<StaffMember>()
  const locationsQuery = useLocations()
  const locations = locationsQuery.data ?? []

  const filters: StaffFilters = {
    location: locationFilter === "all" ? undefined : locationFilter,
  }

  // Keep the current rows on screen while another location loads
  const staffQuery = useQuery({
    queryKey: staffKeys.list(filters),
    queryFn: () => fetchStaff(filters),
    placeholderData: keepPreviousData,
  })

  // The server filters by location too, but it also returns staff with no
  // location, so rows are checked against the selected location's name here
  const selectedLocation = locations.find(
    (l) => l.location_id === locationFilter
  )
  const query = search.trim().toLowerCase()
  const visible = (staffQuery.data ?? [])
    .filter(
      (s) => !selectedLocation || s.work_location === selectedLocation.name
    )
    .filter(
      (s) =>
        s.full_name.toLowerCase().includes(query) ||
        s.role.toLowerCase().includes(query)
    )
    .sort((a, b) => a.full_name.localeCompare(b.full_name))

  const pagination = usePagination(visible)
  const isFiltered = query !== "" || locationFilter !== "all"

  // Tints follow the location's position in the list; unknown names stay muted
  const locationIndex = (name: string | null) =>
    locations.findIndex((l) => l.name === name)

  function open(kind: DialogKind, member?: StaffMember) {
    setSelected(member)
    setOpenDialog(kind)
  }

  function closeDialog(isOpen: boolean) {
    if (!isOpen) setOpenDialog(null)
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
              onChange={(e) => {
                setSearch(e.target.value)
                pagination.reset()
              }}
              placeholder="Search by name or role..."
              aria-label="Search staff"
              className="h-11 rounded-xl pl-10"
            />
          </div>
          <Select
            value={locationFilter}
            onValueChange={(value) => {
              setLocationFilter(value)
              pagination.reset()
            }}
          >
            <SelectTrigger
              aria-label="Filter by location"
              className="h-11 w-full rounded-xl px-3.5 data-[size=default]:h-11 *:data-[slot=select-value]:flex-1 sm:w-auto sm:min-w-52 sm:shrink-0"
            >
              <MapPinIcon className="text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem
                  key={location.location_id}
                  value={location.location_id}
                >
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

        {staffQuery.isPending ? (
          <ul className="divide-y border-t @3xl:border-t-0">
            {Array.from({ length: 5 }, (_, i) => (
              <li
                key={i}
                className="flex items-center gap-3 px-4 py-4 @3xl:px-6"
              >
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </li>
            ))}
          </ul>
        ) : staffQuery.isError ? (
          <div className="flex flex-col items-center gap-3 border-t px-6 py-12 text-center @3xl:border-t-0">
            <p className="text-sm text-muted-foreground">
              {getErrorMessage(staffQuery.error, "Couldn't load staff.")}
            </p>
            <Button
              variant="outline"
              className="h-10 rounded-full px-5"
              onClick={() => staffQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <p className="border-t px-6 py-12 text-center text-sm text-muted-foreground @3xl:border-t-0">
            {isFiltered
              ? "No staff match your search."
              : "No staff yet. Add your first team member."}
          </p>
        ) : (
          <ul
            className={cn(
              "divide-y border-t transition-opacity @3xl:border-t-0",
              staffQuery.isPlaceholderData && "opacity-60"
            )}
          >
            {pagination.pageItems.map((member) => (
              <StaffRow
                key={member.staff_id}
                member={member}
                locationIndex={locationIndex(member.work_location)}
                onView={() => router.push(`/staff/${member.staff_id}`)}
                onDelete={() => open("delete", member)}
              />
            ))}
          </ul>
        )}

        <TablePagination pagination={pagination} label="staff" />
      </Card>

      <AddStaffDialog
        open={openDialog === "add"}
        onOpenChange={closeDialog}
        locations={locations}
      />
      <DeleteStaffDialog
        open={openDialog === "delete"}
        onOpenChange={closeDialog}
        staff={selected}
      />
    </div>
  )
}

function StaffRow({
  member,
  locationIndex,
  onView,
  onDelete,
}: {
  member: StaffMember
  locationIndex: number
  onView: () => void
  onDelete: () => void
}) {
  const location = member.work_location && (
    <LocationPill name={member.work_location} index={locationIndex} />
  )
  const startDate = member.start_date ? formatDate(member.start_date) : "—"

  return (
    <li
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-4 py-4 @3xl:px-6",
        columns
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <StaffAvatar name={member.full_name} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{member.full_name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {member.role}
          </p>
        </div>
      </div>

      {/* Actions sit beside the name on mobile and move last on wide cards */}
      <div className="justify-self-end @3xl:order-last">
        <StaffRowActions
          name={member.full_name}
          onView={onView}
          onDelete={onDelete}
        />
      </div>

      <div className="hidden @3xl:block">{location ?? "—"}</div>
      <div className="hidden min-w-0 text-sm @3xl:block">
        <p>{member.phone ?? "—"}</p>
        <p className="truncate text-xs text-muted-foreground">
          {member.email ?? "—"}
        </p>
      </div>
      <p className="hidden text-sm @3xl:block">{startDate}</p>

      {/* Narrow cards fold location, contact and start date below the name */}
      <div className="col-span-full flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground @3xl:hidden">
        {location}
        {member.phone && <span>{member.phone}</span>}
        {member.start_date && <span>Since {startDate}</span>}
      </div>
    </li>
  )
}
