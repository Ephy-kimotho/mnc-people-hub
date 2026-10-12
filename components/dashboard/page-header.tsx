import { Eyebrow } from "@/components/dashboard/eyebrow"

type PageHeaderProps = {
  eyebrow: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}
