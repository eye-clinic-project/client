import { redirect } from "next/navigation"

import { pageMetadata } from "@/lib/i18n/metadata"
import { VerifyEmailForm } from "./verify-email-form"

export const generateMetadata = pageMetadata("verifyEmail")

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const email = typeof params.email === "string" ? params.email : ""
  if (!email) redirect("/sign-up")
  return <VerifyEmailForm email={email} sendOnMount={params.send === "1"} />
}
