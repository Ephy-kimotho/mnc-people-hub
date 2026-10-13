"use client"

import { Toaster } from "react-hot-toast"

// Colors come from the theme tokens so toasts follow light and dark mode
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 5000,
        className: "text-sm",
        style: {
          background: "var(--popover)",
          color: "var(--popover-foreground)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "12px 14px",
        },
        success: {
          iconTheme: { primary: "var(--success)", secondary: "var(--popover)" },
        },
        error: {
          iconTheme: {
            primary: "var(--destructive)",
            secondary: "var(--popover)",
          },
        },
      }}
    />
  )
}
