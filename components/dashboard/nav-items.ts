import {
  CalendarDaysIcon,
  CirclePlusIcon,
  LayoutGridIcon,
  MapPinIcon,
  UserIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

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
]

// Reached from the header account menu rather than the sidebar
export const accountItems: NavItem[] = [
  { title: "Profile", href: "/profile", icon: UserIcon },
]

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}
