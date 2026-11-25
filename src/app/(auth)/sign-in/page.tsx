/**
 * /sign-in — email/password and Google sign-in.
 *
 * Query params:
 * - callbackUrl: where to go after sign-in (only same-site paths are accepted)
 * - email:       prefill the email field
 * - verified / reset / expired: show an info notice
 * - error:       Auth.js/our error code to show (see lib/auth/sign-in-errors.ts)
 */

import { getTranslations } from "next-intl/server"

import { googleEnabled } from "@/auth"
import { AuthTabs } from "@/components/auth/auth-tabs"
import { safeCallbackUrl, signInErrorCode } from "@/lib/auth/sign-in-errors"
import { pageMetadata } from "@/lib/i18n/metadata"

import { SignInForm } from "./sign-in-form"

export const generateMetadata = pageMetadata("signIn")

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const [params, t] = await Promise.all([
    searchParams,
    getTranslations("auth.signIn"),
  ])
  // At most one info notice, in this priority order.
  const notice = single(params.verified)
    ? t("verified")
    : single(params.reset)
      ? t("reset")
      : single(params.expired)
        ? t("expired")
        : null

  return (
    <>
      <AuthTabs active="sign-in" />
      <SignInForm
        googleEnabled={googleEnabled}
        callbackUrl={safeCallbackUrl(single(params.callbackUrl))}
        defaultEmail={single(params.email) ?? ""}
        notice={notice}
        initialError={signInErrorCode(single(params.error))}
      />
    </>
  )
}
