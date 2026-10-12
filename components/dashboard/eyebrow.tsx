import { cn } from "@/lib/utils"

// Small uppercase gold label used above headings and sections
export function Eyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-[0.7rem] font-semibold tracking-[0.18em] text-brand-ink uppercase",
        className
      )}
      {...props}
    />
  )
}
