import type { Metadata } from "next"

import { StaffDirectory } from "@/components/staff/staff-directory"

export const metadata: Metadata = {
  title: "Staff",
}

export default function StaffPage() {
  return <StaffDirectory />
}
