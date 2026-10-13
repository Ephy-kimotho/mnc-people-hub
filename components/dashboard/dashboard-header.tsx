"use client"

import { MenuIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useSidebar } from "@/components/ui/sidebar"
import {
  accountItems,
  isActivePath,
  navItems,
} from "@/components/dashboard/nav-items"
import { UserMenu } from "@/components/dashboard/user-menu"
import { useAuth } from "@/providers/auth-provider"

export function DashboardHeader() {
  const pathname = usePathname()
  const { toggleSidebar } = useSidebar()
  const { user } = useAuth()
  const current = [...navItems, ...accountItems].find((item) =>
    isActivePath(pathname, item.href)
  )

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur md:px-8 lg:px-12">
      {/* Hamburger opens the drawer on mobile; desktop keeps the sidebar open */}
      <Button
        variant="ghost"
        size="icon"
        className="-ml-1 md:hidden"
        onClick={toggleSidebar}
      >
        <MenuIcon className="size-5" />
        <span className="sr-only">Open menu</span>
      </Button>

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden sm:inline-flex">
            <BreadcrumbLink asChild>
              <Link href="/overview">MNCPeople</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden sm:block">
            /
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            {/* Pages outside the nav, like the 404, fall back to "Workspace" */}
            <BreadcrumbPage>{current?.title ?? "Workspace"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto">
        <ThemeToggle />
      </div>
      <Badge className="hidden h-7 border-brand/40 bg-brand-soft px-3 text-xs text-brand-ink capitalize sm:inline-flex">
        {user?.role ?? "staff"} workspace
      </Badge>
      <UserMenu />
    </header>
  )
}
