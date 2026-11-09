import { Suspense } from "react"

import { AuthSplit } from "@/components/auth/auth-split"
import { VerifyForm } from "@/components/auth/verify-form"

export default function VerifyPage() {
  return (
    <AuthSplit>
      <Suspense>
        <VerifyForm />
      </Suspense>
    </AuthSplit>
  )
}
