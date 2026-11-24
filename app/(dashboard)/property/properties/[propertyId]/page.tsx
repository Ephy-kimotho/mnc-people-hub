import type { Metadata } from "next"

import { PropertyDetail } from "@/components/property/property-detail"

export const metadata: Metadata = { title: "Property" }

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ propertyId: string }>
}) {
  const { propertyId } = await params
  return <PropertyDetail propertyId={propertyId} />
}
