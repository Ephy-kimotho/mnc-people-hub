"use client"

import { LogOutIcon } from "lucide-react"
import Link from "next/link"

import { accountItems } from "@/components/dashboard/nav-items"
import { StaffAvatar } from "@/components/staff/staff-bits"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/providers/auth-provider"

// Avatar button with the signed-in user's details, profile link and log out
export function UserMenu() {
  const { user, logout } = useAuth()
  if (!user) return null

  const name = user.full_name || user.username

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <StaffAvatar name={name} className="size-8 text-sm" />
          <span className="sr-only">Open account menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">
            {name}
          </span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {accountItems.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href}>
              <item.icon />
              {item.title}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onSelect={() => void logout()}>
          <LogOutIcon />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
