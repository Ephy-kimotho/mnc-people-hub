"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { PlusIcon, ShieldOffIcon } from "lucide-react"
import { useState } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import { TablePagination } from "@/components/table-pagination"
import { StaffAvatar } from "@/components/staff/staff-bits"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { AddUserDialog } from "@/components/users/add-user-dialog"
import { DeleteUserDialog } from "@/components/users/delete-user-dialog"
import { DisableUserDialog } from "@/components/users/disable-user-dialog"
import { UserRoleBadge, UserStatusBadge } from "@/components/users/user-badges"
import { UserRowActions } from "@/components/users/user-row-actions"
import { UserStats } from "@/components/users/user-stats"
import { usePagination } from "@/hooks/use-pagination"
import { useRoles } from "@/hooks/use-roles"
import { getErrorMessage } from "@/lib/api/errors"
import { fetchUsers, usersKeys } from "@/lib/api/users"
import { formatDateTime } from "@/lib/format"
import type { RoleName, User, UserFilters } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/auth-provider"

type RoleFilter = RoleName | "all"
type StatusFilter = "all" | "active" | "inactive"
type DialogKind = "add" | "disable" | "delete"

// Shared by header and rows so columns line up once the card is wide enough
const columns =
  "@3xl:grid-cols-[minmax(0,1.6fr)_minmax(0,0.6fr)_minmax(0,0.6fr)_minmax(0,1fr)_3rem] @3xl:gap-x-4"

const selectClass =
  "h-11 w-full rounded-xl px-3.5 data-[size=default]:h-11 *:data-[slot=select-value]:flex-1 sm:w-48"

export function UsersView() {
  const { user } = useAuth()

  if (user?.role !== "admin") {
    return (
      <Card className="mx-auto max-w-md items-center gap-3 rounded-2xl px-6 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldOffIcon className="size-5" />
        </span>
        <h1 className="font-heading text-xl font-semibold">Admins only</h1>
        <p className="text-sm text-muted-foreground">
          You need an administrator account to manage users.
        </p>
      </Card>
    )
  }

  return <UsersManager currentUserId={user.user_id} />
}

function UsersManager({ currentUserId }: { currentUserId: string }) {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [openDialog, setOpenDialog] = useState<DialogKind | null>(null)
  const [selected, setSelected] = useState<User>()
  const rolesQuery = useRoles()

  const filters: UserFilters = {
    role: roleFilter === "all" ? undefined : roleFilter,
    active: statusFilter === "all" ? undefined : statusFilter === "active",
  }

  // Keep the current rows on screen while a new filter loads
  const usersQuery = useQuery({
    queryKey: usersKeys.list(filters),
    queryFn: () => fetchUsers(filters),
    placeholderData: keepPreviousData,
  })

  const pagination = usePagination(usersQuery.data ?? [])
  const isFiltered = roleFilter !== "all" || statusFilter !== "all"

  function open(kind: DialogKind, user?: User) {
    setSelected(user)
    setOpenDialog(kind)
  }

  function closeDialog(isOpen: boolean) {
    if (!isOpen) setOpenDialog(null)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Access control"
        title="User Management"
        description="Manage who can log in to MNC People and what they can do."
        action={
          <Button
            className="h-10 self-start rounded-full px-5"
            onClick={() => open("add")}
          >
            <PlusIcon />
            Add User
          </Button>
        }
      />

      <UserStats />

      <Card className="@container gap-0 rounded-2xl py-0 shadow-xs">
        <div className="flex flex-col gap-3 p-4 sm:flex-row">
          <Select
            value={roleFilter}
            onValueChange={(value) => {
              setRoleFilter(value as RoleFilter)
              pagination.reset()
            }}
          >
            <SelectTrigger aria-label="Filter by role" className={selectClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {rolesQuery.data?.map((role) => (
                <SelectItem key={role.name} value={role.name}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as StatusFilter)
              pagination.reset()
            }}
          >
            <SelectTrigger
              aria-label="Filter by status"
              className={selectClass}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div
          className={cn(
            "hidden border-y bg-muted/50 px-6 py-3 text-[0.7rem] font-medium tracking-[0.14em] text-muted-foreground uppercase @3xl:grid",
            columns
          )}
        >
          <span>User</span>
          <span>Role</span>
          <span>Status</span>
          <span>Last login</span>
          <span className="text-right">Actions</span>
        </div>

        {usersQuery.isPending ? (
          <ul className="divide-y border-t @3xl:border-t-0">
            {Array.from({ length: 5 }, (_, i) => (
              <li
                key={i}
                className="flex items-center gap-3 px-4 py-4 @3xl:px-6"
              >
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </li>
            ))}
          </ul>
        ) : usersQuery.isError ? (
          <div className="flex flex-col items-center gap-3 border-t px-6 py-12 text-center @3xl:border-t-0">
            <p className="text-sm text-muted-foreground">
              {getErrorMessage(usersQuery.error, "Couldn't load users.")}
            </p>
            <Button
              variant="outline"
              className="h-10 rounded-full px-5"
              onClick={() => usersQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : usersQuery.data.length === 0 ? (
          <p className="border-t px-6 py-12 text-center text-sm text-muted-foreground @3xl:border-t-0">
            {isFiltered ? "No users match these filters." : "No users yet."}
          </p>
        ) : (
          <ul
            className={cn(
              "divide-y border-t transition-opacity @3xl:border-t-0",
              usersQuery.isPlaceholderData && "opacity-60"
            )}
          >
            {pagination.pageItems.map((user) => (
              <UserRow
                key={user.user_id}
                user={user}
                isCurrentUser={user.user_id === currentUserId}
                onDisable={() => open("disable", user)}
                onDelete={() => open("delete", user)}
              />
            ))}
          </ul>
        )}

        <TablePagination pagination={pagination} label="users" />
      </Card>

      <AddUserDialog open={openDialog === "add"} onOpenChange={closeDialog} />
      <DisableUserDialog
        open={openDialog === "disable"}
        onOpenChange={closeDialog}
        user={selected}
      />
      <DeleteUserDialog
        open={openDialog === "delete"}
        onOpenChange={closeDialog}
        user={selected}
      />
    </div>
  )
}

function UserRow({
  user,
  isCurrentUser,
  onDisable,
  onDelete,
}: {
  user: User
  isCurrentUser: boolean
  onDisable: () => void
  onDelete: () => void
}) {
  const name = user.full_name || user.username
  const lastLogin = user.last_login_at
    ? formatDateTime(user.last_login_at)
    : "Never"

  return (
    <li
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-4 py-4 @3xl:px-6",
        columns
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <StaffAvatar name={name} />
        <div className="min-w-0">
          <p className="truncate font-semibold">
            {name}
            {isCurrentUser && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                (you)
              </span>
            )}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Actions sit beside the name on mobile and move last on wide cards.
          Admins can't change or delete their own account from here. */}
      <div className="justify-self-end @3xl:order-last">
        {!isCurrentUser && (
          <UserRowActions
            user={user}
            onDisable={onDisable}
            onDelete={onDelete}
          />
        )}
      </div>

      <div className="hidden @3xl:block">
        <UserRoleBadge role={user.role} />
      </div>
      <div className="hidden @3xl:block">
        <UserStatusBadge user={user} />
      </div>
      <p className="hidden text-sm @3xl:block">{lastLogin}</p>

      {/* Narrow cards fold role, status and last login below the name */}
      <div className="col-span-full flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground @3xl:hidden">
        <UserRoleBadge role={user.role} />
        <UserStatusBadge user={user} />
        <span>Last login: {lastLogin}</span>
      </div>
    </li>
  )
}
