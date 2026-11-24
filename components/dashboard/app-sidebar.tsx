"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  activeNavHref,
  canSeeNavItem,
  navItemsForSection,
  sectionForPath,
} from "@/components/dashboard/nav-items"
import { SectionSwitcher } from "@/components/dashboard/section-switcher"
import { useAuth } from "@/providers/auth-provider"

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const { user } = useAuth()
  const section = sectionForPath(pathname)
  const visibleItems = navItemsForSection(section).filter((item) =>
    canSeeNavItem(item, user)
  )
  const activeHref = activeNavHref(pathname, visibleItems)

  return (
    <Sidebar>
      <SidebarHeader className="items-center border-b border-sidebar-border px-5 py-3">
        <Link
          href={section === "property" ? "/property" : "/overview"}
          onClick={() => setOpenMobile(false)}
        >
          <Image
            src={
              section === "property"
                ? "/images/propertyhub-logo.png"
                : "/images/mncpeople-logo-transparent.png"
            }
            alt={
              section === "property"
                ? "MNC Property by Manga Capital"
                : "MNC People by Manga Capital"
            }
            width={section === "property" ? 926 : 877}
            height={section === "property" ? 657 : 689}
            priority
            className="h-auto w-24 dark:invert"
          />
        </Link>
      </SidebarHeader>

      <div className="pt-4">
        <SectionSwitcher />
      </div>

      <SidebarContent className="px-2 pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 text-[0.7rem] font-semibold tracking-[0.18em] text-brand-ink uppercase">
            {section === "property" ? "Property" : "Workspace"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {visibleItems.map((item) => {
                const active = activeHref === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="h-11 rounded-full px-4 text-[0.95rem] data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground [&_svg]:size-4.5"
                    >
                      {/* Close the mobile drawer once a link is picked */}
                      <Link
                        href={item.href}
                        onClick={() => setOpenMobile(false)}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                        {active && (
                          <span className="ml-auto size-1.5 shrink-0 rounded-full bg-current" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

    </Sidebar>
  )
}
