"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState, type FormEvent } from "react"

import { AuthHeading } from "@/components/auth/auth-split"
import { useI18n } from "@/components/i18n-provider"
import { Alert, Button, Field, Input, RateLimitNotice } from "@/components/rc/ui"
import { useCooldown } from "@/hooks/use-api"
import { errorMessage, RateLimitError } from "@/service/api-client"
import { authService } from "@/service/auth.service"

export function VerifyForm() {
  const router = useRouter()
  const params = useSearchParams()
  const verifyCooldown = useCooldown()
  const resendCooldown = useCooldown()
  const { t } = useI18n()
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
      setError(t.auth.enterEmailFirst)
      return
    }
    setSending(true)
    try {
      await authService.resendVerification(email.trim())
      setNotice(t.auth.codeSent(email.trim()))
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
      setError(t.auth.codeInvalid)
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
      <AuthHeading title={t.auth.verifyTitle} subtitle={t.auth.verifySubtitle} />
      {error && <Alert>{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}
      <RateLimitNotice remaining={Math.max(verifyCooldown.remaining, resendCooldown.remaining)} />

      <Field label={t.auth.email}>
        {(p) => <Input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
      </Field>
      <Field label={t.auth.code}>
        {(p) => (
          <Input
            {...p}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            dir="ltr"
            placeholder="123456"
            className="font-heading text-2xl tracking-[0.5em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        )}
      </Field>

      <Button type="submit" size="lg" loading={busy} disabled={verifyCooldown.active}>
        {t.auth.verifyButton}
      </Button>
      <Button variant="outline" size="lg" onClick={resend} loading={sending} disabled={resendCooldown.active}>
        {t.auth.sendNewCode}
      </Button>
      <p className="text-center text-[15px] text-muted-foreground">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          {t.auth.backToLogin}
        </Link>
      </p>
    </form>
  )
}
