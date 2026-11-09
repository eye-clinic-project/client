import { Suspense } from "react"

import { AuthSplit } from "@/components/auth/auth-split"
import { ResetPasswordForm } from "@/components/auth/password-forms"

export default function ResetPasswordPage() {
  return (
    <AuthSplit>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthSplit>
  )
}
