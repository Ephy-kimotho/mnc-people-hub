import {
  BellIcon,
  Building2Icon,
  CalendarDaysIcon,
  CirclePlusIcon,
  FileTextIcon,
  HouseIcon,
  LandmarkIcon,
  LayoutGridIcon,
  MapPinIcon,
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
  { title: "Submit Leave", href: "/submit-leave", icon: CirclePlusIcon },
  { title: "Users", href: "/users", icon: UserPlus },
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
