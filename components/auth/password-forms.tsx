"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, type FormEvent } from "react"

import { AuthHeading } from "@/components/auth/auth-split"
import { Alert, Button, Field, Input, RateLimitNotice } from "@/components/rc/ui"
import { useCooldown } from "@/hooks/use-api"
import { errorMessage, RateLimitError } from "@/service/api-client"
import { authService } from "@/service/auth.service"

export function ForgotPasswordForm() {
  const cooldown = useCooldown()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim()) return setError("Enter your email address.")
    setBusy(true)
    try {
      await authService.forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      cooldown.trip(err)
      if (!(err instanceof RateLimitError)) setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <AuthHeading title="Reset your password" subtitle="We will email you a link that works once, for 15 minutes." />
      {error && <Alert>{error}</Alert>}
      {sent && (
        <Alert tone="success">If an account uses {email.trim()}, a reset link is on its way. Check your inbox.</Alert>
      )}
      <RateLimitNotice remaining={cooldown.remaining} />
      <Field label="Email">
        {(p) => <Input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
      </Field>
      <Button type="submit" size="lg" loading={busy} disabled={cooldown.active}>
        Send reset link
      </Button>
      <p className="text-center text-[15px] text-muted-foreground">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  )
}

export function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get("token") ?? ""
  const invite = params.get("invite") === "1"
  const cooldown = useCooldown()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError("Password must be at least 8 characters.")
    if (password !== confirm) return setError("The passwords do not match.")
    setBusy(true)
    try {
      await authService.resetPassword(token, password)
      router.replace("/login?reset=1")
    } catch (err) {
      cooldown.trip(err)
      if (!(err instanceof RateLimitError)) setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-5">
        <AuthHeading title="Link not valid" />
        <Alert>This page needs the link from the password email. Request a new one.</Alert>
        <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
          Request a new link
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <AuthHeading
        title={invite ? "Set your password" : "Choose a new password"}
        subtitle={invite ? "Your doctor created your RetinaCare account. Choose a password to sign in." : undefined}
      />
      {error && <Alert>{error}</Alert>}
      <RateLimitNotice remaining={cooldown.remaining} />
      <Field label="New password" hint="At least 8 characters.">
        {(p) => (
          <Input {...p} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        )}
      </Field>
      <Field label="Confirm password">
        {(p) => (
          <Input {...p} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        )}
      </Field>
      <Button type="submit" size="lg" loading={busy} disabled={cooldown.active}>
        Save password
      </Button>
    </form>
  )
}
