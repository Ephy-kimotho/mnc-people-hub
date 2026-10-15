# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

MNC People: a staff leave management system built on Next.js 16 (App Router), React 19, Tailwind v4 and shadcn/ui. The user will share screenshots of how pages should look. Build them in the simplest, most intuitive way that matches the screenshot.

## Commands

```bash
npm run dev        # start dev server (also regenerates AGENTS.md)
npm run build      # production build
npm run lint       # eslint (flat config, next core-web-vitals + typescript)
npm run typecheck  # tsc --noEmit
npm run format     # prettier on all .ts/.tsx (sorts Tailwind classes)
npx shadcn@latest add <component>   # add a shadcn/ui component to components/ui
```

There is no test runner configured yet.

## Architecture

- `app/(auth)/`: login, forgot-password and reset-password pages under a shared auth layout.
- `app/(dashboard)/`: overview, leaves, submit-leave, staff and locations pages under a shared dashboard layout.
- Most route files are still empty stubs. Both group layouts must accept and render `children` when they are built out.
- `app/layout.tsx` sets the fonts as CSS variables (`--font-sans` Space Grotesk, `--font-heading` DM Sans, `--font-mono` Geist Mono) and wraps the app in `ThemeProvider` (next-themes, follows the system theme by default; the header `ThemeToggle` and pressing `d` switch between light and dark).
- Theme tokens (oklch CSS variables for light and `.dark`) live in `app/globals.css`. Use the semantic Tailwind classes (`bg-primary`, `text-muted-foreground`, etc.) rather than raw colors.
- shadcn uses the `radix-nova` style with the unified `radix-ui` package and `lucide-react` icons. Path alias `@/*` maps to the repo root.
- `cn` in `lib/utils.ts` is re-exported from the `cn` npm package, not the usual clsx + tailwind-merge helper.
- Brand assets (logos, favicon, OG image) are in `public/images/`.
- Domain types are in `lib/types.ts` and leave helpers (labels, `isOnLeave`) are in `lib/leave.ts`. Pages read placeholder data from `lib/mock-data.ts` until a backend exists.
- Components are grouped by feature: `components/dashboard/` (shell, `PageHeader`, `Eyebrow`), `components/leave/` (status badge, add-to-calendar menu), and one folder per page (e.g. `components/overview/`).
- Theme colors beyond shadcn's: `brand` / `brand-soft` / `brand-ink` (gold accents and eyebrow labels), `success` / `success-soft` (approved states) and `warning` (pending amounts).

## Conventions

- **Forms**: use `react-hook-form` with `zod` (v4) through `@hookform/resolvers/zod`.
- **Schemas**: put them in `lib/schemas/<domain>.ts`, for example auth schemas in `lib/schemas/auth.ts`. Export the schema and its inferred type (`z.infer<typeof schema>`) from the same file.
- **Dates and formatting**: `date-fns` is the main date/time library. Use `Intl` only for things date-fns doesn't cover, such as currency and number formatting. Put shared format helpers (dates, times, currency, etc.) in `lib/format.ts` and reuse them instead of formatting inline.
- **Date inputs**: use `DatePicker` from `components/date-picker.tsx` (shadcn Calendar + Popover), not `<input type="date">`. It takes and returns ISO `yyyy-MM-dd` strings, so zod can validate them with `z.iso.date()`.
- **Row actions**: tables and lists use a vertical three-dot (`EllipsisVerticalIcon`) dropdown for per-row actions, not inline buttons. Destructive actions open an `AlertDialog` that names the record, e.g. "Delete Abdi Nyongesa?".
- **Dialogs**: the base `DialogContent` / `AlertDialogContent` in `components/ui/` are sized to `w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto`. Don't override the width per dialog. Put form state in a child of `DialogContent` so it resets each time the dialog opens.
- **Pagination**: tables show at most 10 rows per page. Use `usePagination(items)` from `hooks/use-pagination.ts`, render its `pageItems`, put `<TablePagination pagination={...} label="..." />` (`components/table-pagination.tsx`) at the bottom of the table card, and call `pagination.reset()` when a filter or search changes.
- **Mutations and toasts**: run API writes through TanStack Query `useMutation`. Every mutation shows a `react-hot-toast` toast on success and on failure (use `getErrorMessage` from `lib/api/errors.ts` for the failure text). Don't add inline success screens or inline API error messages; field validation errors still show under their fields. The `Toaster` (5s duration, theme-token colors) is mounted in `providers/toast-provider.tsx`.
- **Comments**: comments are welcome, but keep each one to 3 lines or fewer and use it to explain what a code segment does.
- **Prettier style**: no semicolons, double quotes, 2-space indent, trailing commas (es5), 80-column width.
