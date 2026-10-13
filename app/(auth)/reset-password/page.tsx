import type { Metadata } from "next"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata: Metadata = {
  title: "Reset password",
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>
}) {
  const { token } = await searchParams
  return (
    <ResetPasswordForm token={typeof token === "string" ? token : undefined} />
  )
}
