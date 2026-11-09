"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, type FormEvent } from "react"

import { AuthHeading } from "@/components/auth/auth-split"
import { Alert, Button, Field, Input, RateLimitNotice } from "@/components/rc/ui"
import { useCooldown } from "@/hooks/use-api"
import { homeFor, useSession } from "@/hooks/use-session"
import { ApiError, errorMessage, RateLimitError } from "@/service/api-client"
import { authService } from "@/service/auth.service"

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { refresh } = useSession()
  const cooldown = useCooldown()
  const [email, setEmail] = useState(params.get("email") ?? "")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [unverified, setUnverified] = useState(false)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setUnverified(false)
    if (!email.trim() || !password) {
      setError("Enter your email and password.")
      return
    }
    setBusy(true)
    try {
      await authService.login(email.trim(), password)
      const me = await refresh()
      router.replace(homeFor(me?.role))
    } catch (err) {
      cooldown.trip(err)
      if (err instanceof ApiError && err.code === "EMAIL_NOT_VERIFIED") setUnverified(true)
      else if (!(err instanceof RateLimitError)) setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <AuthHeading title="Log in" subtitle="Welcome back. Use your email and password." />

      {params.get("expired") && !error && <Alert tone="info">Your session ended. Please log in again.</Alert>}
      {params.get("verified") && !error && <Alert tone="success">Email verified. You can log in now.</Alert>}
      {params.get("reset") && !error && <Alert tone="success">Password changed. Log in with your new password.</Alert>}
      {error && <Alert>{error}</Alert>}
      {unverified && (
        <Alert tone="warning">
          Verify your email before logging in.{" "}
          <Link href={`/verify-otp?email=${encodeURIComponent(email.trim())}&resend=1`} className="font-semibold underline">
            Get a verification code
          </Link>
        </Alert>
      )}
      <RateLimitNotice remaining={cooldown.remaining} />

      <Field label="Email">
        {(p) => (
          <Input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        )}
      </Field>
      <Field
        label="Password"
        action={
          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        }
      >
        {(p) => (
          <Input
            {...p}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}
      </Field>

      <Button type="submit" size="lg" loading={busy} disabled={cooldown.active}>
        Log in
      </Button>

      <p className="mt-1 text-center text-[15px] text-muted-foreground">
        New to RetinaCare?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  )
}
