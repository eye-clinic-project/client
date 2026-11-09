import { AuthSplit } from "@/components/auth/auth-split"
import { ForgotPasswordForm } from "@/components/auth/password-forms"

export default function ForgotPasswordPage() {
  return (
    <AuthSplit>
      <ForgotPasswordForm />
    </AuthSplit>
  )
}
