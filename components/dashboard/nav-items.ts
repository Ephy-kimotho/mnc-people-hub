import {
  CalendarDaysIcon,
  CirclePlusIcon,
  LayoutGridIcon,
  MapPinIcon,
  UserIcon,
  UsersIcon,
  UserPlus,
  type LucideIcon,
} from "lucide-react"

import type { RoleName } from "@/lib/types"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  // Only these roles see the link; omit it to show the link to everyone
  roles?: RoleName[]
}

// Shared by the sidebar links and the header breadcrumb
export const navItems: NavItem[] = [
  { title: "Overview", href: "/overview", icon: LayoutGridIcon },
  { title: "Staff Directory", href: "/staff", icon: UsersIcon },
  { title: "Locations", href: "/locations", icon: MapPinIcon },
  { title: "Leave Requests", href: "/leaves", icon: CalendarDaysIcon },
  { title: "Submit Leave", href: "/submit-leave", icon: CirclePlusIcon },
  { title: "Users", href: "/users", icon: UserPlus, roles: ["admin"] },
]

// Reached from the header account menu rather than the sidebar
export const accountItems: NavItem[] = [
  { title: "Profile", href: "/profile", icon: UserIcon },
]

export function canSeeNavItem(item: NavItem, role?: RoleName) {
  return !item.roles || (role !== undefined && item.roles.includes(role))
}

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}
