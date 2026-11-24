import {
  BellIcon,
  Building2Icon,
  CalendarDaysIcon,
  CalendarRangeIcon,
  FileTextIcon,
  ShieldCheckIcon,
  CirclePlusIcon,
  HouseIcon,
  LandmarkIcon,
  LayoutGridIcon,
  MapPinIcon,
  MegaphoneIcon,
  ScrollTextIcon,
  SettingsIcon,
  UserIcon,
  UsersIcon,
  UserPlus,
  WrenchIcon,
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
  { title: "Leave Calendar", href: "/leave-calendar", icon: CalendarRangeIcon },
  { title: "Leave Policies", href: "/leave-policies", icon: FileTextIcon },
  { title: "Submit Leave", href: "/submit-leave", icon: CirclePlusIcon },
  { title: "Announcements", href: "/announcements", icon: MegaphoneIcon },
  { title: "Users", href: "/users", icon: UserPlus },
  { title: "Notifications", href: "/notifications", icon: BellIcon },
  { title: "Settings", href: "/settings", icon: SettingsIcon },
  { title: "Audit Log", href: "/audit", icon: ScrollTextIcon },
  { title: "Auth Audit", href: "/audit/auth", icon: ShieldCheckIcon },
]

export type NavSection = "people" | "property"

export const propertyNavItems: NavItem[] = [
  { title: "Property Overview", href: "/property", icon: HouseIcon },
  { title: "Properties", href: "/property/properties", icon: Building2Icon },
  { title: "Tenants", href: "/property/tenants", icon: UsersIcon },
  { title: "Leases", href: "/property/leases", icon: FileTextIcon },
  { title: "Banking", href: "/property/banking", icon: LandmarkIcon },
  { title: "Operations", href: "/property/operations", icon: WrenchIcon },
  { title: "Reminders", href: "/property/reminders", icon: BellIcon },
]

export const allNavItems = [...navItems, ...propertyNavItems]

export function sectionForPath(pathname: string): NavSection {
  return pathname === "/property" || pathname.startsWith("/property/")
    ? "property"
    : "people"
}

export function navItemsForSection(section: NavSection) {
  return section === "property" ? propertyNavItems : navItems
}

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

// The longest matching href wins, so /audit/auth highlights only Auth Audit
export function activeNavHref(
  pathname: string,
  items: readonly NavItem[]
): string | null {
  let best: string | null = null
  for (const item of items) {
    if (!isActivePath(pathname, item.href)) continue
    if (!best || item.href.length > best.length) best = item.href
  }
  return best
}
