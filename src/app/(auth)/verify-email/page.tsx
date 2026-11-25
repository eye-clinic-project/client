/**
 * /verify-email?email=…[&send=1] — enter the 6-digit code sent by email.
 * `send=1` sends a fresh code on arrival (used when sign-in finds an unverified account).
 * Without an email there is nothing to verify → back to /sign-up.
 */

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
