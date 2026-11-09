import { Suspense } from "react"

import { AuthSplit } from "@/components/auth/auth-split"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <AuthSplit>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthSplit>
  )
}
