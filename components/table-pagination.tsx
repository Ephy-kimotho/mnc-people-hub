"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Pagination } from "@/hooks/use-pagination"

type TablePaginationProps = {
  pagination: Pagination<unknown>
  // Plural noun for the count, e.g. "users" -> "Showing 1–10 of 24 users"
  label: string
}

// Footer for a paginated table card; hidden when everything fits on one page
export function TablePagination({ pagination, label }: TablePaginationProps) {
  const { page, pageCount, from, to, total } = pagination

  if (pageCount <= 1) return null

  return (
    <div className="flex flex-col items-center gap-3 border-t px-4 py-3 sm:flex-row sm:justify-between @3xl:px-6">
      <p className="text-sm text-muted-foreground">
        Showing {from}–{to} of {total} {label}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-full px-3"
          onClick={pagination.previous}
          disabled={!pagination.hasPrevious}
        >
          <ChevronLeftIcon />
          Previous
        </Button>
        <span className="min-w-20 text-center text-sm">
          Page {page} of {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-full px-3"
          onClick={pagination.next}
          disabled={!pagination.hasNext}
        >
          Next
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  )
}
