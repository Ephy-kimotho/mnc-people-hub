"use client"

import type { LucideIcon } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"

type FileDropzoneProps = {
  id: string
  icon: LucideIcon
  // What's being picked, e.g. "photo" -> "Drag a photo here, or browse"
  noun: string
  // Accepted types and size, e.g. "JPG, PNG or WebP, up to 5 MB"
  hint: string
  accept: string
  invalid?: boolean
  onPick: (file: File) => void
}

// Click to browse or drop a file onto it. The input stays focusable for
// keyboard users, and the label shows its focus ring.
export function FileDropzone({
  id,
  icon: Icon,
  noun,
  hint,
  accept,
  invalid = false,
  onPick,
}: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false)

  return (
    <label
      htmlFor={id}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        const file = event.dataTransfer.files[0]
        if (file) onPick(file)
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors hover:bg-muted/50 has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
        dragging && "border-brand bg-brand-soft",
        invalid && "border-destructive"
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand-ink">
        <Icon className="size-5" />
      </span>
      <span className="space-y-1">
        <span className="block text-sm font-medium">
          Drag a {noun} here, or{" "}
          <span className="text-brand-ink underline-offset-4 hover:underline">
            browse
          </span>
        </span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <input
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onPick(file)
        }}
      />
    </label>
  )
}
