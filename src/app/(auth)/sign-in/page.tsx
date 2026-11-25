import { getTranslations } from "next-intl/server"

import { googleEnabled } from "@/auth"
import { AuthTabs } from "@/components/auth/auth-tabs"
import { pageMetadata } from "@/lib/i18n/metadata"
import { safeCallbackUrl, signInErrorCode } from "@/util/auth-messages"
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
