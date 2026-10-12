"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Eyebrow } from "@/components/dashboard/eyebrow"
import { isActivePath, navItems } from "@/components/dashboard/nav-items"

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  return (
    <Sidebar>
      <SidebarHeader className="items-center border-b border-sidebar-border px-6 py-6">
        <Link href="/overview" onClick={() => setOpenMobile(false)}>
          <Image
            src="/images/mncpeople-logo-transparent.png"
            alt="MNC People by Manga Capital"
            width={877}
            height={689}
            priority
            className="h-auto w-44 dark:invert"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 pt-6">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 text-[0.7rem] font-semibold tracking-[0.18em] text-brand-ink uppercase">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href)
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

      <SidebarFooter className="gap-2 border-t border-sidebar-border px-5 py-6">
        <Eyebrow>Leave guidance</Eyebrow>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Kenya Employment Act · 21 working days of annual leave with full pay.
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
