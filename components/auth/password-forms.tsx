"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, type FormEvent } from "react"

import { AuthHeading } from "@/components/auth/auth-split"
import { useI18n } from "@/components/i18n-provider"
import { Alert, Button, Field, Input, RateLimitNotice } from "@/components/rc/ui"
import { useCooldown } from "@/hooks/use-api"
import { errorMessage, RateLimitError } from "@/service/api-client"
import { authService } from "@/service/auth.service"

export function ForgotPasswordForm() {
  const cooldown = useCooldown()
  const { t } = useI18n()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim()) return setError(t.auth.enterEmail)
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
      <AuthHeading title={t.auth.forgotTitle} subtitle={t.auth.forgotSubtitle} />
      {error && <Alert>{error}</Alert>}
      {sent && (
        <Alert tone="success">{t.auth.resetSent(email.trim())}</Alert>
      )}
      <RateLimitNotice remaining={cooldown.remaining} />
      <Field label={t.auth.email}>
        {(p) => <Input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
      </Field>
      <Button type="submit" size="lg" loading={busy} disabled={cooldown.active}>
        {t.auth.sendResetLink}
      </Button>
      <p className="text-center text-[15px] text-muted-foreground">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          {t.auth.backToLogin}
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
  const { t } = useI18n()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError(t.errors.passwordMin)
    if (password !== confirm) return setError(t.auth.passwordsDiffer)
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
        <AuthHeading title={t.auth.linkInvalidTitle} />
        <Alert>{t.auth.linkInvalid}</Alert>
        <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
          {t.auth.requestNewLink}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <AuthHeading
        title={invite ? t.auth.setPasswordTitle : t.auth.newPasswordTitle}
        subtitle={invite ? t.auth.setPasswordSubtitle : undefined}
      />
      {error && <Alert>{error}</Alert>}
      <RateLimitNotice remaining={cooldown.remaining} />
      <Field label={t.auth.newPassword} hint={t.auth.passwordHint}>
        {(p) => (
          <Input {...p} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        )}
      </Field>
      <Field label={t.auth.confirmPassword}>
        {(p) => (
          <Input {...p} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        )}
      </Field>
      <Button type="submit" size="lg" loading={busy} disabled={cooldown.active}>
        {t.auth.savePassword}
      </Button>
    </form>
  )
}
