import type { Metadata } from "next"

import { NeedsAttentionView } from "@/components/property/needs-attention-view"

export const metadata: Metadata = { title: "Needs Attention" }

export default function NeedsAttentionPage() {
  return <NeedsAttentionView />
}
