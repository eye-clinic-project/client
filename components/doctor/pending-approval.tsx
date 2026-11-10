"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import { BadgeCheck, Check, Clock3, FileWarning, RefreshCw, ShieldCheck, UserRoundCheck } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { Alert, Button, Card, Field, Input, RateLimitNotice } from "@/components/rc/ui"
import { useCooldown } from "@/hooks/use-api"
import { isApproved, useSession } from "@/hooks/use-session"
import type { DoctorProfile } from "@/lib/api-types"
import { fmtDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { errorMessage, RateLimitError } from "@/service/api-client"
import { doctorService } from "@/service/doctor.service"

const POLL_MS = 30_000

/** Shown to doctors until an admin approves their license. Lets them fix and resend it. */
export function PendingApproval() {
  const { me, refresh } = useSession()
  const router = useRouter()
  const { t } = useI18n()
  const p = t.pending
  const cooldown = useCooldown()

  const verification = me?.verification
  const status = verification?.status ?? null
  const profile = (me?.profile as DoctorProfile | null) ?? null

  const [form, setForm] = useState(() => ({
    clinicName: profile?.clinicName ?? "",
    clinicAddress: profile?.clinicAddress ?? "",
    specialty: profile?.specialty ?? "",
    licenseNumber: verification?.licenseNumber ?? "",
  }))
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({})
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check for the admin's decision in the background.
  useEffect(() => {
    const timer = window.setInterval(() => void refresh(), POLL_MS)
    return () => window.clearInterval(timer)
  }, [refresh])

  const approved = isApproved(me)
  useEffect(() => {
    if (!approved) return
    const timer = window.setTimeout(() => router.replace("/doctor"), 1200)
    return () => window.clearTimeout(timer)
  }, [approved, router])

  async function checkNow() {
    setChecking(true)
    await refresh()
    setChecking(false)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    const found: typeof errors = {}
    if (!form.licenseNumber.trim()) found.licenseNumber = t.auth.licenseRequired
    if (!profile) {
      if (!form.clinicName.trim()) found.clinicName = t.auth.clinicNameRequired
      if (!form.clinicAddress.trim()) found.clinicAddress = t.auth.clinicAddressRequired
    }
    setErrors(found)
    if (Object.keys(found).length) return

    setBusy(true)
    try {
      await doctorService.updateMe({
        licenseNumber: form.licenseNumber.trim(),
        ...(!profile && {
          clinicName: form.clinicName.trim(),
          clinicAddress: form.clinicAddress.trim(),
          specialty: form.specialty.trim() || undefined,
        }),
      })
      await refresh()
      setNotice(p.sent)
    } catch (err) {
      cooldown.trip(err)
      if (!(err instanceof RateLimitError)) setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (!me) return null

  if (approved) {
    return (
      <Alert tone="success" className="text-base">
        {p.approved}
      </Alert>
    )
  }

  const title = status === "rejected" ? p.titleRejected : status ? p.titlePending : p.titleMissing
  const body = status === "rejected" ? p.bodyRejected : status ? p.bodyPending : p.bodyMissing
  const HeroIcon = status === "rejected" ? FileWarning : status ? Clock3 : ShieldCheck

  // 0 account, 1 submitted, 2 review, 3 active
  const reached = status ? 2 : 1
  const steps = [
    { label: p.steps.account, icon: UserRoundCheck },
    { label: p.steps.submitted, icon: BadgeCheck },
    { label: p.steps.review, icon: status === "rejected" ? FileWarning : Clock3 },
    { label: p.steps.active, icon: ShieldCheck },
  ]
  const formTitle = status === "rejected" ? p.formTitleRejected : status ? p.formTitlePending : p.formTitleMissing

  return (
    <>
      <section
        className={cn(
          "relative overflow-hidden rounded-2xl px-6 py-8 text-white sm:px-10 sm:py-10",
          status === "rejected" ? "bg-[#7a2318]" : "bg-brand-deep",
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -end-16 -top-16 size-64 rounded-full border-[28px] border-white/5"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
            <HeroIcon className="size-7" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-white/70">{p.eyebrow}</p>
            <h1 className="font-heading text-[28px] leading-tight font-semibold tracking-tight sm:text-[32px]">{title}</h1>
            <p className="max-w-2xl text-[15px] leading-relaxed text-white/80">{body}</p>
          </div>
        </div>

        <ol className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {steps.map((step, index) => {
            const done = index < reached
            const current = index === reached
            const Icon = step.icon
            return (
              <li
                key={step.label}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm",
                  done ? "bg-white/15" : current ? "bg-white text-brand-deep" : "bg-white/5 text-white/60",
                  current && status === "rejected" && "text-[#7a2318]",
                )}
                aria-current={current ? "step" : undefined}
              >
                {done ? <Check className="size-4 shrink-0" aria-hidden="true" /> : <Icon className="size-4 shrink-0" aria-hidden="true" />}
                <span className="font-medium">{step.label}</span>
              </li>
            )
          })}
        </ol>
      </section>

      {notice && <Alert tone="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}
      <RateLimitNotice remaining={cooldown.remaining} />

      {status === "rejected" && verification?.rejectionReason && (
        <Alert tone="warning">
          <strong className="block">{p.reason}</strong>
          {verification.rejectionReason}
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card className="p-6 sm:p-7">
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">{formTitle}</h2>
              <p className="text-sm text-muted-foreground">{p.formHint}</p>
            </div>

            {!profile && (
              <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                <Field label={t.auth.clinicName} error={errors.clinicName}>
                  {(f) => (
                    <Input {...f} value={form.clinicName} onChange={(e) => setForm({ ...form, clinicName: e.target.value })} />
                  )}
                </Field>
                <Field label={t.auth.clinicAddress} error={errors.clinicAddress}>
                  {(f) => (
                    <Input
                      {...f}
                      placeholder={t.auth.clinicAddressPlaceholder}
                      value={form.clinicAddress}
                      onChange={(e) => setForm({ ...form, clinicAddress: e.target.value })}
                    />
                  )}
                </Field>
                <Field label={t.auth.specialty} optional className="sm:col-span-2">
                  {(f) => (
                    <Input {...f} value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
                  )}
                </Field>
              </div>
            )}

            <Field label={t.auth.licenseNumber} hint={t.auth.licenseHint} error={errors.licenseNumber}>
              {(f) => (
                <Input
                  {...f}
                  dir="ltr"
                  autoComplete="off"
                  className="font-mono tracking-wide"
                  value={form.licenseNumber}
                  onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                />
              )}
            </Field>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" loading={busy} disabled={cooldown.active}>
                {p.send}
              </Button>
              <Button variant="outline" onClick={() => void checkNow()} loading={checking}>
                {!checking && <RefreshCw className="size-4" aria-hidden="true" />}
                {p.checkStatus}
              </Button>
            </div>
            <p className="text-[13px] text-muted-foreground">{p.autoRefresh}</p>
          </form>
        </Card>

        <div className="flex flex-col gap-5">
          {status && (
            <Card className="flex flex-col gap-3 p-6">
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground">{p.license}</dt>
                  <dd dir="ltr" className="font-mono text-base font-semibold tracking-wide rtl:text-end">
                    {verification?.licenseNumber ?? t.common.dash}
                  </dd>
                </div>
                {profile?.clinicName && (
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-muted-foreground">{p.clinic}</dt>
                    <dd className="font-medium">{profile.clinicName}</dd>
                  </div>
                )}
                {verification?.submittedAt && (
                  <p className="text-muted-foreground">{p.submittedOn(fmtDate(verification.submittedAt))}</p>
                )}
                {status === "rejected" && verification?.reviewedAt && (
                  <p className="text-muted-foreground">{p.reviewedOn(fmtDate(verification.reviewedAt))}</p>
                )}
              </dl>
            </Card>
          )}
          <Card className="p-6">
            <h2 className="mb-3 font-semibold">{p.nextTitle}</h2>
            <ol className="flex flex-col gap-3 text-sm text-subtle-foreground">
              {p.next.map((item, index) => (
                <li key={item} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  )
}
