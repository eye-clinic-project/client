"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState, type FormEvent } from "react"

import { AuthHeading } from "@/components/auth/auth-split"
import { Alert, Button, Field, Input, RateLimitNotice } from "@/components/rc/ui"
import { useCooldown } from "@/hooks/use-api"
import { errorMessage, RateLimitError } from "@/service/api-client"
import { authService } from "@/service/auth.service"

export function VerifyForm() {
  const router = useRouter()
  const params = useSearchParams()
  const verifyCooldown = useCooldown()
  const resendCooldown = useCooldown()
  const [email, setEmail] = useState(params.get("email") ?? "")
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sending, setSending] = useState(false)
  const autoSent = useRef(false)

  async function resend() {
    setError(null)
    setNotice(null)
    if (!email.trim()) {
      setError("Enter your email first.")
      return
    }
    setSending(true)
    try {
      await authService.resendVerification(email.trim())
      setNotice(`We sent a new code to ${email.trim()}. It is valid for 10 minutes.`)
    } catch (err) {
      resendCooldown.trip(err)
      if (!(err instanceof RateLimitError)) setError(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    if (params.get("resend") && !autoSent.current && email) {
      autoSent.current = true
      void resend()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from the email.")
      return
    }
    setBusy(true)
    try {
      await authService.verifyEmail(email.trim(), code)
      router.replace(`/login?verified=1&email=${encodeURIComponent(email.trim())}`)
    } catch (err) {
      verifyCooldown.trip(err)
      if (!(err instanceof RateLimitError)) setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <AuthHeading title="Verify your email" subtitle="Enter the 6-digit code we emailed you." />
      {error && <Alert>{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}
      <RateLimitNotice remaining={Math.max(verifyCooldown.remaining, resendCooldown.remaining)} />

      <Field label="Email">
        {(p) => <Input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
      </Field>
      <Field label="Verification code">
        {(p) => (
          <Input
            {...p}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            className="font-heading text-2xl tracking-[0.5em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        )}
      </Field>

      <Button type="submit" size="lg" loading={busy} disabled={verifyCooldown.active}>
        Verify email
      </Button>
      <Button variant="outline" size="lg" onClick={resend} loading={sending} disabled={resendCooldown.active}>
        Send a new code
      </Button>
      <p className="text-center text-[15px] text-muted-foreground">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  )
}
