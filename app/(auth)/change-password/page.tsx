import type { Metadata } from "next"

import { ChangePasswordForm } from "@/components/auth/change-password-form"

export const metadata: Metadata = {
  title: "Set your password",
}

export default function ChangePasswordPage() {
  return <ChangePasswordForm />
}
