import { FileImageIcon, FileTextIcon } from "lucide-react"

import { Card } from "@/components/ui/card"

// Empty until GET /mnc/documents?staff_id= is wired up; uploads come with it
const groups = [
  {
    icon: FileTextIcon,
    title: "Employment Contracts",
    empty: "No contracts uploaded yet.",
  },
  {
    icon: FileImageIcon,
    title: "ID / Passport Copies",
    empty: "No ID or passport copies uploaded yet.",
  },
]

export function DocumentsCard() {
  return (
    <Card className="gap-0 rounded-2xl py-0 shadow-xs">
      <div className="flex items-center gap-4 border-b px-6 py-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <FileTextIcon className="size-4" />
        </span>
        <div>
          <h2 className="font-heading text-base font-semibold">Documents</h2>
          <p className="text-xs text-muted-foreground">
            Contracts &amp; ID copies
          </p>
        </div>
      </div>

      <div className="divide-y">
        {groups.map(({ icon: Icon, title, empty }) => (
          <section key={title} className="space-y-3 px-6 py-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Icon className="size-4 text-muted-foreground" />
              {title}
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                0
              </span>
            </h3>
            <p className="rounded-xl border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
              {empty}
            </p>
          </section>
        ))}
      </div>
    </Card>
  )
}
