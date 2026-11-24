import type { Metadata } from "next"

import { BankingView } from "@/components/property/banking-view"

export const metadata: Metadata = { title: "Banking" }

export default function BankingPage() {
  return <BankingView />
}
