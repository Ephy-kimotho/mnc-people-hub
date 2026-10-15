"use client"

import { useQuery } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { ArrowLeftIcon, FileTextIcon } from "lucide-react"
import Link from "next/link"

import {
  DetailsCard,
  DetailsList,
} from "@/components/staff-profile/details-card"
import { DocumentsCard } from "@/components/staff-profile/documents-card"
import { EmergencyContactsCard } from "@/components/staff-profile/emergency-contacts-card"
import { LeaveBalance } from "@/components/staff-profile/leave-balance"
import { LifeCoverCard } from "@/components/staff-profile/life-cover-card"
import { ProfileCard } from "@/components/staff-profile/profile-card"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getErrorMessage } from "@/lib/api/errors"
import { fetchStaffMember, staffKeys } from "@/lib/api/staff"
import { formatDate } from "@/lib/format"
import { canAccessPage } from "@/lib/permissions"
import type { StaffMember } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

export function StaffProfile({ staffId }: { staffId: string }) {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: staffKeys.detail(staffId),
    queryFn: () => fetchStaffMember(staffId),
  })

  return (
    <div className="space-y-6">
      {/* Staff viewing their own profile can't open the directory */}
      {canAccessPage(user, "/staff") && (
        <Link
          href="/staff"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Back to Directory
        </Link>
      )}

      {query.isPending ? (
        <ProfileSkeleton />
      ) : query.isError ? (
        <ProfileError
          notFound={
            isAxiosError(query.error) && query.error.response?.status === 404
          }
          message={getErrorMessage(query.error, "Couldn't load this profile.")}
          onRetry={() => query.refetch()}
        />
      ) : (
        <ProfileLayout staff={query.data} />
      )}
    </div>
  )
}

function ProfileLayout({ staff }: { staff: StaffMember }) {
  const firstName = staff.full_name.split(" ")[0]

  const identity = [
    { label: "Staff No.", value: staff.staff_number },
    { label: "National ID No.", value: staff.national_id },
    {
      label: "Date of Birth",
      value: staff.date_of_birth && formatDate(staff.date_of_birth),
    },
    { label: "Driver's License", value: staff.drivers_licence },
    { label: "Passport No.", value: staff.passport },
    { label: "NSSF No.", value: staff.nssf_number },
    { label: "SHA No.", value: staff.sha_number },
    { label: "KRA PIN No.", value: staff.kra_pin },
    { label: "SACCO", value: staff.sacco },
  ]

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <div className="space-y-6">
        <ProfileCard staff={staff} />
        <DetailsCard icon={FileTextIcon} title="Identity Documents">
          <DetailsList rows={identity} />
        </DetailsCard>
        <EmergencyContactsCard staff={staff} />
      </div>

      <div className="space-y-6">
        <LeaveBalance staffId={staff.staff_id} />
        <LifeCoverCard staff={staff} />
        <DocumentsCard staff={staff} />

        <div className="flex flex-col gap-4 rounded-2xl border border-brand/30 bg-brand-soft/60 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="font-heading text-lg font-semibold">
              Need to request time off?
            </p>
            <p className="text-sm text-muted-foreground">
              Submit a leave request on behalf of {firstName}.
            </p>
          </div>
          <Button asChild className="h-12 shrink-0 rounded-xl px-6 text-base">
            <Link href={`/submit-leave?staff=${staff.staff_id}`}>
              Submit Request
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function ProfileError({
  notFound,
  message,
  onRetry,
}: {
  notFound: boolean
  message: string
  onRetry: () => void
}) {
  return (
    <Card className="items-center gap-3 rounded-2xl px-6 py-12 text-center shadow-xs">
      <p className="text-sm text-muted-foreground">
        {notFound
          ? "This staff member doesn't exist or has been removed."
          : message}
      </p>
      {!notFound && (
        <Button
          variant="outline"
          className="h-10 rounded-full px-5"
          onClick={onRetry}
        >
          Try again
        </Button>
      )}
    </Card>
  )
}

function ProfileSkeleton() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <Card className="items-center gap-4 rounded-2xl px-6 py-8 shadow-xs">
        <Skeleton className="size-24 rounded-full" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <div className="w-full space-y-4 pt-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </Card>
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  )
}
