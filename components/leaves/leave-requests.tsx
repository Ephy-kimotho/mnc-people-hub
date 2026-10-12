"use client"

import { useState } from "react"

import { PageHeader } from "@/components/dashboard/page-header"
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge"
import { EditLeaveDialog } from "@/components/leaves/edit-leave-dialog"
import { LeaveRowActions } from "@/components/leaves/leave-row-actions"
import { RecallLeaveDialog } from "@/components/leaves/recall-leave-dialog"
import { RejectLeaveDialog } from "@/components/leaves/reject-leave-dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDateRange } from "@/lib/format"
import { leaveTypeLabels, workingDays } from "@/lib/leave"
import type { LeaveRequestValues } from "@/lib/schemas/leave"
import type { LeaveRequest, LeaveStatus, Staff } from "@/lib/types"
import { cn } from "@/lib/utils"

type Tab = LeaveStatus | "all"
type DialogKind = "edit" | "reject" | "recall"

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

// Changes live in local state until there's a backend to save to
export function LeaveRequests({
  initialRequests,
  staff,
}: {
  initialRequests: LeaveRequest[]
  staff: Staff[]
}) {
  const [requests, setRequests] = useState(initialRequests)
  const [openDialog, setOpenDialog] = useState<DialogKind | null>(null)
  const [selected, setSelected] = useState<LeaveRequest>()

  const staffById = new Map(staff.map((s) => [s.id, s]))
  const selectedName = selected && staffById.get(selected.staffId)?.name
  const sorted = [...requests].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  )

  function open(kind: DialogKind, request: LeaveRequest) {
    setSelected(request)
    setOpenDialog(kind)
  }

  function closeDialog(isOpen: boolean) {
    if (!isOpen) setOpenDialog(null)
  }

  function update(id: string, changes: Partial<LeaveRequest>) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...changes } : r))
    )
  }

  function saveEdit({ type, startDate, endDate, reason }: LeaveRequestValues) {
    if (!selected) return
    update(selected.id, {
      type,
      startDate,
      endDate,
      reason: reason || undefined,
      days: workingDays(startDate, endDate),
    })
    setOpenDialog(null)
  }

  function rejectSelected(reason: string) {
    if (!selected) return
    update(selected.id, { status: "rejected", rejectionReason: reason })
    setOpenDialog(null)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Time away"
        title="Leave Requests"
        description="Review and manage time off requests."
      />

      <Card className="@container gap-0 rounded-2xl py-0 shadow-xs">
        <Tabs defaultValue="pending" className="gap-0">
          {/* Scrolls sideways on narrow screens instead of wrapping the tabs */}
          <div className="overflow-x-auto border-b px-4">
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

          {tabs.map((tab) => {
            const rows = sorted.filter(
              (r) => tab.value === "all" || r.status === tab.value
            )
            return (
              <TabsContent key={tab.value} value={tab.value}>
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

                {rows.length === 0 ? (
                  <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                    {tab.empty}
                  </p>
                ) : (
                  <ul className="divide-y">
                    {rows.map((request) => {
                      const member = staffById.get(request.staffId)
                      const name = member?.name ?? "Former staff"
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
                              {member?.role ?? "—"}
                            </p>
                          </div>

                          {/* Actions sit beside the name on mobile and move last on wide cards */}
                          <div className="justify-self-end @3xl:order-last">
                            <LeaveRowActions
                              name={name}
                              status={request.status}
                              event={{
                                title: `${name} – ${type}`,
                                description: member?.role,
                                start: request.startDate,
                                end: request.endDate,
                              }}
                              onApprove={() =>
                                update(request.id, { status: "approved" })
                              }
                              onReject={() => open("reject", request)}
                              onEdit={() => open("edit", request)}
                              onRecall={() => open("recall", request)}
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
                                {formatDateRange(
                                  request.startDate,
                                  request.endDate
                                )}
                              </p>
                              <Badge
                                variant="secondary"
                                className="rounded-md font-normal"
                              >
                                {request.days} working{" "}
                                {request.days === 1 ? "day" : "days"}
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
              </TabsContent>
            )
          })}
        </Tabs>
      </Card>

      <EditLeaveDialog
        open={openDialog === "edit"}
        onOpenChange={closeDialog}
        request={selected}
        name={selectedName}
        onSave={saveEdit}
      />
      <RejectLeaveDialog
        open={openDialog === "reject"}
        onOpenChange={closeDialog}
        name={selectedName}
        onReject={rejectSelected}
      />
      <RecallLeaveDialog
        open={openDialog === "recall"}
        onOpenChange={closeDialog}
        name={selectedName}
        onConfirm={() =>
          selected && update(selected.id, { status: "recalled" })
        }
      />
    </div>
  )
}
