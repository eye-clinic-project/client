import { pageMetadata } from "@/lib/i18n/metadata"
import { googleEnabled } from "@/auth"
import { AuthTabs } from "@/components/auth/auth-tabs"
import { SignUpForm } from "./sign-up-form"

export const generateMetadata = pageMetadata("signUp")

export default function SignUpPage() {
  return (
    <>
      <AuthTabs active="sign-up" />
      <SignUpForm googleEnabled={googleEnabled} />
    </>
  )
}
