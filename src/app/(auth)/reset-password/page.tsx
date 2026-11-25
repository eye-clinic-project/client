/** /reset-password?email=… — enter the emailed code and a new password. */

import { pageMetadata } from "@/lib/i18n/metadata"

import { ResetPasswordForm } from "./reset-password-form"

export const generateMetadata = pageMetadata("resetPassword")

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { email } = await searchParams
  return (
    <ResetPasswordForm defaultEmail={typeof email === "string" ? email : ""} />
  )
}
