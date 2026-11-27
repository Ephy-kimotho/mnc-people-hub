"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { SearchIcon } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

import { PageHeader } from "@/components/dashboard/page-header"
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge"
import { ApproveLeaveDialog } from "@/components/leaves/approve-leave-dialog"
import { EditLeaveDialog } from "@/components/leaves/edit-leave-dialog"
import { LeaveRowActions } from "@/components/leaves/leave-row-actions"
import { RecallLeaveDialog } from "@/components/leaves/recall-leave-dialog"
import { RejectLeaveDialog } from "@/components/leaves/reject-leave-dialog"
import { TablePagination } from "@/components/table-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useVisibleLeaveRequests } from "@/hooks/use-leave-requests"
import { usePagination } from "@/hooks/use-pagination"
import { getErrorMessage } from "@/lib/api/errors"
import {
  fetchLeaveDocumentUrl,
  leaveKeys,
  updateLeaveRequest,
} from "@/lib/api/leaves"
import { formatDateRange } from "@/lib/format"
import { durationLabel, leaveTypeLabels } from "@/lib/leave"
import { canRecallLeave, canReviewLeave } from "@/lib/permissions"
import type { LeaveRequestValues } from "@/lib/schemas/leave"
import type { LeaveRequest, LeaveStatus, LeaveType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/auth-provider"

type Tab = LeaveStatus | "all"
type DialogKind = "approve" | "edit" | "reject" | "recall"

const tabs: { value: Tab; label: string; empty: string }[] = [
  {
    value: "pending",
    label: "Pending",
    empty: "No requests waiting for a decision.",
  },
  { value: "approved", label: "Approved", empty: "No approved requests yet." },
  { value: "rejected", label: "Rejected", empty: "No rejected requests." },
  { value: "recalled", label: "Recalled", empty: "No recalled requests." },
  { value: "all", label: "All Requests", empty: "No leave requests yet." },
]

// Shared by header and rows so columns line up once the card is wide enough
const columns =
  "@3xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_3rem] @3xl:gap-x-4"

type LeaveQuery = ReturnType<typeof useVisibleLeaveRequests>

// Edits are kept as local changes on top of the fetched requests until
// their endpoint is wired up. Approve, reject and recall hit the API.
// Staff only see their own requests and can only recall them.
export function LeaveRequests() {
  const leaveQuery = useVisibleLeaveRequests()
  const queryClient = useQueryClient()
  const [openDialog, setOpenDialog] = useState<DialogKind | null>(null)
  const [selected, setSelected] = useState<LeaveRequest>()
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<LeaveType | "all">("all")

  const edit = useMutation({
    mutationFn: ({ id, values }: { id: string; values: LeaveRequestValues }) =>
      updateLeaveRequest(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leaveKeys.all })
      toast.success("Leave request updated")
      setOpenDialog(null)
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't update the leave request.")),
  })

  const selectedName = selected?.staffName
  const term = search.trim().toLowerCase()
  const sorted = (leaveQuery.data ?? [])
    .filter((request) => {
      const matchesSearch =
        !term ||
        [request.staffName, request.staffRole]
          .join(" ")
          .toLowerCase()
          .includes(term)
      const matchesType = typeFilter === "all" || request.type === typeFilter
      return matchesSearch && matchesType
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  function open(kind: DialogKind, request: LeaveRequest) {
    setSelected(request)
    setOpenDialog(kind)
  }

  function closeDialog(isOpen: boolean) {
    if (!isOpen) setOpenDialog(null)
  }

  function saveEdit(values: LeaveRequestValues) {
    if (!selected) return
    edit.mutate({ id: selected.id, values })
  }

  async function viewDocument(request: LeaveRequest) {
    try {
      const { url } = await fetchLeaveDocumentUrl(request.id)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't open the document."))
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Time away"
        title="Leave Requests"
        description="Review and manage time off requests."
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by staff name or role…"
            className="h-11 rounded-full pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value as LeaveType | "all")
          }
          className="h-11 rounded-full border bg-background px-3.5 text-sm"
          aria-label="Filter by leave type"
        >
          <option value="all">All types</option>
          <option value="annual">Annual</option>
          <option value="sick">Sick</option>
          <option value="emergency">Emergency</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      <Card className="@container gap-0 rounded-2xl py-0 shadow-xs">
        <Tabs defaultValue="pending" className="gap-0">
          {/* Scrolls sideways on narrow screens instead of wrapping the tabs */}
          <div className="overflow-x-auto border-b px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList
              variant="line"
              className="gap-2 pb-1 group-data-horizontal/tabs:h-13"
            >
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="px-3">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              <LeaveTable
                query={leaveQuery}
                rows={sorted.filter(
                  (r) => tab.value === "all" || r.status === tab.value
                )}
                empty={tab.empty}
                onOpen={open}
                onViewDocument={viewDocument}
              />
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      <ApproveLeaveDialog
        open={openDialog === "approve"}
        onOpenChange={closeDialog}
        request={selected}
      />
      <EditLeaveDialog
        open={openDialog === "edit"}
        onOpenChange={closeDialog}
        request={selected}
        name={selectedName}
        saving={edit.isPending}
        onSave={saveEdit}
      />
      <RejectLeaveDialog
        open={openDialog === "reject"}
        onOpenChange={closeDialog}
        request={selected}
      />
      <RecallLeaveDialog
        open={openDialog === "recall"}
        onOpenChange={closeDialog}
        request={selected}
      />
    </div>
  )
}

// One tab's table. Radix unmounts inactive tabs, so switching tabs starts
// the pagination back on page 1.
function LeaveTable({
  query,
  rows,
  empty,
  onOpen,
  onViewDocument,
}: {
  query: LeaveQuery
  rows: LeaveRequest[]
  empty: string
  onOpen: (kind: DialogKind, request: LeaveRequest) => void
  onViewDocument: (request: LeaveRequest) => void
}) {
  const { user } = useAuth()
  const canReview = canReviewLeave(user)
  const pagination = usePagination(rows)

  return (
    <>
      <div
        className={cn(
          "hidden border-b bg-muted/50 px-6 py-3 text-[0.7rem] font-medium tracking-[0.14em] text-muted-foreground uppercase @3xl:grid",
          columns
        )}
      >
        <span>Staff member</span>
        <span>Request details</span>
        <span>Dates &amp; duration</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>

      {query.isPending ? (
        <ul className="divide-y">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="space-y-2 px-4 py-4 @3xl:px-6">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </li>
          ))}
        </ul>
      ) : query.isError ? (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(query.error, "Couldn't load leave requests.")}
          </p>
          <Button
            variant="outline"
            className="h-10 rounded-full px-5"
            onClick={() => query.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="divide-y">
          {pagination.pageItems.map((request) => {
            const name = request.staffName
            const type = `${leaveTypeLabels[request.type]} Leave`
            return (
              <li
                key={request.id}
                className={cn(
                  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-4 py-4 @3xl:px-6",
                  columns
                )}
              >
                <div className="min-w-0">
                  <p className="font-semibold">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    {request.staffRole}
                  </p>
                </div>

                {/* Actions sit beside the name on mobile and move last on wide cards */}
                <div className="justify-self-end @3xl:order-last">
                  <LeaveRowActions
                    name={name}
                    status={request.status}
                    event={{
                      title: `${name} – ${type}`,
                      description: request.staffRole,
                      start: request.startDate,
                      end: request.endDate,
                    }}
                    onApprove={
                      canReview ? () => onOpen("approve", request) : undefined
                    }
                    onReject={
                      canReview ? () => onOpen("reject", request) : undefined
                    }
                    onEdit={() => onOpen("edit", request)}
                    onViewDocument={
                      request.hasDocument
                        ? () => onViewDocument(request)
                        : undefined
                    }
                    onRecall={
                      canRecallLeave(user, request)
                        ? () => onOpen("recall", request)
                        : undefined
                    }
                  />
                </div>

                {/* Narrow cards wrap these three cells under the name */}
                <div className="col-span-full flex flex-wrap items-center gap-x-4 gap-y-2 @3xl:contents">
                  <div>
                    <Badge variant="secondary" className="h-6 px-2.5">
                      {type}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm">
                      {formatDateRange(request.startDate, request.endDate)}
                    </p>
                    <Badge
                      variant="secondary"
                      className="rounded-md font-normal"
                    >
                      {durationLabel(request)}
                    </Badge>
                  </div>
                  <div className="min-w-0 space-y-1">
                    <LeaveStatusBadge status={request.status} />
                    {request.status === "rejected" &&
                      request.rejectionReason && (
                        <p
                          title={request.rejectionReason}
                          className="line-clamp-2 text-xs text-muted-foreground"
                        >
                          {request.rejectionReason}
                        </p>
                      )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <TablePagination pagination={pagination} label="requests" />
    </>
  )
}
