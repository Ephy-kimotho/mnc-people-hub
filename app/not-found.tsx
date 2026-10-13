import type { Metadata } from "next"

import { NotFoundView } from "@/components/not-found-view"

export const metadata: Metadata = {
  title: "Page not found",
}

// Handles every URL that doesn't match a route
export default function NotFound() {
  return <NotFoundView />
}
