"use client"

import { ArrowLeftIcon, FileQuestionMarkIcon } from "lucide-react"
import Link from "next/link"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Eyebrow } from "@/components/dashboard/eyebrow"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/providers/auth-provider"

// Signed-in users get the 404 inside the dashboard; everyone else sees only
// the card, pointing them to the login page
export function NotFoundView() {
  const { isLoggedIn } = useAuth()

  if (!isLoggedIn) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
        <NotFoundCard
          description="The address may have changed. Log in to get back to your staff and leave records."
          href="/login"
          linkLabel="Go to login"
        />
      </main>
    )
  }

  return (
    <DashboardShell>
      <div className="flex justify-center pt-6 md:pt-12">
        <NotFoundCard
          description="The address may have changed. Your staff and leave records are still right where you left them."
          href="/overview"
          linkLabel="Back to overview"
        />
      </div>
    </DashboardShell>
  )
}

type NotFoundCardProps = {
  description: string
  href: string
  linkLabel: string
}

function NotFoundCard({ description, href, linkLabel }: NotFoundCardProps) {
  return (
    <Card className="w-full max-w-md gap-0 rounded-2xl p-8 shadow-sm sm:p-10">
      <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
        <FileQuestionMarkIcon className="size-5" />
      </span>
      <Eyebrow className="mt-7">Page not found · 404</Eyebrow>
      <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight">
        This page isn&apos;t here.
      </h1>
      <p className="mt-3 text-muted-foreground">{description}</p>
      <Button asChild className="mt-7 h-10 self-start rounded-full px-5">
        <Link href={href}>
          <ArrowLeftIcon />
          {linkLabel}
        </Link>
      </Button>
    </Card>
  )
}
