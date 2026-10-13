import { useState } from "react"

export const PAGE_SIZE = 10

export type Pagination<T> = ReturnType<typeof usePagination<T>>

// Splits a list into pages on the client. The page is clamped to the last
// one, so removing rows (deletes, filters) never leaves you on an empty page.
export function usePagination<T>(items: T[], pageSize = PAGE_SIZE) {
  const [requestedPage, setRequestedPage] = useState(1)

  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(requestedPage, pageCount)
  const start = (page - 1) * pageSize

  function setPage(next: number) {
    setRequestedPage(Math.min(Math.max(1, next), pageCount))
  }

  return {
    page,
    pageCount,
    total,
    pageItems: items.slice(start, start + pageSize),
    // 1-based positions of the first and last row shown, e.g. "11–20 of 24"
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
    hasPrevious: page > 1,
    hasNext: page < pageCount,
    setPage,
    previous: () => setPage(page - 1),
    next: () => setPage(page + 1),
    reset: () => setRequestedPage(1),
  }
}
