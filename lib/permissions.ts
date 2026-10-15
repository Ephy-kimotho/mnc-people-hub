import type { AuthUser, LeaveRequest, RoleName } from "@/lib/types"

type Viewer = Pick<AuthUser, "role" | "staff_id"> | null | undefined

// Pages limited to some roles, matched by path prefix. Pages not listed are
// open to everyone signed in. Used by the sidebar and the page guard.
const restrictedPages: { href: string; roles: RoleName[] }[] = [
  { href: "/users", roles: ["admin"] },
  { href: "/locations", roles: ["admin", "manager"] },
  { href: "/staff", roles: ["admin", "manager"] },
]

export function canAccessPage(user: Viewer, pathname: string) {
  if (!user) return false
  // Staff can't browse the directory but can open their own profile
  if (user.role === "staff" && pathname === ownProfilePath(user)) return true
  const page = restrictedPages.find(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`)
  )
  return !page || page.roles.includes(user.role)
}

export function ownProfilePath(user: Viewer) {
  return user?.staff_id ? `/staff/${user.staff_id}` : undefined
}

// Adding, editing and deleting staff records, photos and documents
export function canManageStaff(user: Viewer) {
  return user?.role === "admin"
}

// Approving, rejecting and recalling anyone's leave
export function canReviewLeave(user: Viewer) {
  return user?.role === "admin" || user?.role === "manager"
}

// Staff only see their own requests
export function canSeeLeave(user: Viewer, request: LeaveRequest) {
  return canReviewLeave(user) || isOwnLeave(user, request)
}

// Reviewers can recall any request; staff can recall their own
export function canRecallLeave(user: Viewer, request: LeaveRequest) {
  return canReviewLeave(user) || isOwnLeave(user, request)
}

function isOwnLeave(user: Viewer, request: LeaveRequest) {
  return Boolean(user?.staff_id) && request.staffId === user?.staff_id
}

// Team-wide figures on the overview; staff get their own figures instead
export function canSeeTeamOverview(user: Viewer) {
  return canReviewLeave(user)
}

// Staff accounts only work with their own leave and profile
export function isStaffRole(user: Viewer) {
  return user?.role === "staff"
}
