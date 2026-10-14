import type { Metadata } from "next"

import { StaffProfile } from "@/components/staff-profile/staff-profile"

export const metadata: Metadata = {
  title: "Staff Profile",
}

export default async function StaffProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <StaffProfile staffId={id} />
}
