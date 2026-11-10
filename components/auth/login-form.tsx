"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, type FormEvent } from "react"

import { AuthHeading } from "@/components/auth/auth-split"
import { useI18n } from "@/components/i18n-provider"
import { Alert, Button, Field, Input, RateLimitNotice } from "@/components/rc/ui"
import { useCooldown } from "@/hooks/use-api"
import { homeFor, useSession } from "@/hooks/use-session"
import { ApiError, errorMessage, RateLimitError } from "@/service/api-client"
import { authService } from "@/service/auth.service"
import { userService } from "@/service/user.service"

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { refresh } = useSession()
  const { t, locale } = useI18n()
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
      setError(t.auth.enterEmailPassword)
      return
    }
    setBusy(true)
    try {
      await authService.login(email.trim(), password)
      const me = await refresh()
      // Keep the account's language (used for emails) in step with the language chosen here.
      if (me && me.lang !== locale) void userService.setLanguage(locale).catch(() => null)
      router.replace(homeFor(me))
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
      <AuthHeading title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle} />

      {params.get("expired") && !error && <Alert tone="info">{t.auth.sessionEnded}</Alert>}
      {params.get("verified") && !error && <Alert tone="success">{t.auth.verifiedNotice}</Alert>}
      {params.get("reset") && !error && <Alert tone="success">{t.auth.resetNotice}</Alert>}
      {error && <Alert>{error}</Alert>}
      {unverified && (
        <Alert tone="warning">
          {t.auth.verifyFirst}{" "}
          <Link href={`/verify-otp?email=${encodeURIComponent(email.trim())}&resend=1`} className="font-semibold underline">
            {t.auth.getCode}
          </Link>
        </Alert>
      )}
      <RateLimitNotice remaining={cooldown.remaining} />

      <Field label={t.auth.email}>
        {(p) => (
          <Input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        )}
      </Field>
      <Field
        label={t.auth.password}
        action={
          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            {t.auth.forgotPassword}
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
        {t.auth.loginTitle}
      </Button>

      <p className="mt-1 text-center text-[15px] text-muted-foreground">
        {t.auth.newHere}{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          {t.auth.createAccount}
        </Link>
      </p>
    </form>
  )
}
