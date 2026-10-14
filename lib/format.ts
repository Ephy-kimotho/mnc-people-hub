import { format, isSameDay, isSameYear, parseISO } from "date-fns"

type DateInput = Date | string

const toDate = (date: DateInput) =>
  typeof date === "string" ? parseISO(date) : date

// "Apr 6, 2026"
export function formatDate(date: DateInput) {
  return format(toDate(date), "MMM d, yyyy")
}

// "Mar 30 – Apr 4, 2026"; the year is only repeated when it changes
export function formatDateRange(start: DateInput, end: DateInput) {
  const from = toDate(start)
  const to = toDate(end)
  if (isSameDay(from, to)) return formatDate(to)
  const startPattern = isSameYear(from, to) ? "MMM d" : "MMM d, yyyy"
  return `${format(from, startPattern)} – ${formatDate(to)}`
}

// "Apr 6, 2026 · 2:30 PM"
export function formatDateTime(date: DateInput) {
  return format(toDate(date), "MMM d, yyyy · h:mm a")
}

// "2026-04-06"; the storage format used by forms and records
export function formatISODate(date: Date) {
  return format(date, "yyyy-MM-dd")
}

// "1 Day", "5 Days"
export function formatDayCount(days: number) {
  return `${days} ${days === 1 ? "Day" : "Days"}`
}

// "1,000,000"; whole shilling amounts without a currency symbol
export function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(
    amount
  )
}
