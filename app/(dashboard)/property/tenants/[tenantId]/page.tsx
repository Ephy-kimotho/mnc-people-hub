import type { Metadata } from "next"

import { TenantDetail } from "@/components/property/tenant-detail"

export const metadata: Metadata = { title: "Tenant" }

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string }>
}) {
  const { tenantId } = await params
  return <TenantDetail tenantId={tenantId} />
}
