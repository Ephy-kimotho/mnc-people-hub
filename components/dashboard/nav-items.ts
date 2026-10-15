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

import { canAccessPage } from "@/lib/permissions"
import type { AuthUser } from "@/lib/types"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
}

// Shared by the sidebar links and the header breadcrumb
export const navItems: NavItem[] = [
  { title: "Overview", href: "/overview", icon: LayoutGridIcon },
  { title: "Staff Directory", href: "/staff", icon: UsersIcon },
  { title: "Locations", href: "/locations", icon: MapPinIcon },
  { title: "Leave Requests", href: "/leaves", icon: CalendarDaysIcon },
  { title: "Submit Leave", href: "/submit-leave", icon: CirclePlusIcon },
  { title: "Users", href: "/users", icon: UserPlus },
]

// Reached from the header account menu rather than the sidebar
export const accountItems: NavItem[] = [
  { title: "Profile", href: "/profile", icon: UserIcon },
]

// Links follow the same rules as the pages, set in lib/permissions.ts
export function canSeeNavItem(item: NavItem, user: AuthUser | null) {
  return canAccessPage(user, item.href)
}

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}
