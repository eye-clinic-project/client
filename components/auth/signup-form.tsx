"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

import { Alert, Button, Checkbox, ChoiceCard, Field, Input, Logo, RateLimitNotice } from "@/components/rc/ui"
import { ThemeToggle } from "@/components/theme-toggle"
import { useI18n } from "@/components/i18n-provider"
import { LanguageSwitcher } from "@/components/language-switcher"
import type { Messages } from "@/lib/i18n"
import { useCooldown } from "@/hooks/use-api"
import { errorMessage, RateLimitError } from "@/service/api-client"
import { authService } from "@/service/auth.service"

type Values = {
  role: "patient" | "doctor"
  name: string
  email: string
  password: string
  city: string
  clinicName: string
  clinicAddress: string
  specialty: string
  licenseNumber: string
  acceptTerms: boolean
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(v: Values, t: Messages) {
  const errors: Partial<Record<keyof Values, string>> = {}
  if (!v.name.trim()) errors.name = t.errors.nameRequired
  if (!EMAIL.test(v.email.trim())) errors.email = t.errors.validEmail
  if (v.password.length < 8) errors.password = t.errors.passwordMin
  if (!v.city.trim()) errors.city = t.errors.cityRequired
  if (v.role === "doctor") {
    if (!v.clinicName.trim()) errors.clinicName = t.auth.clinicNameRequired
    if (!v.clinicAddress.trim()) errors.clinicAddress = t.auth.clinicAddressRequired
  }
  if (!v.acceptTerms) errors.acceptTerms = t.auth.consentRequired
  return errors
}

export function SignupForm() {
  const router = useRouter()
  const cooldown = useCooldown()
  const { t } = useI18n()
  const [values, setValues] = useState<Values>({
    role: "patient",
    name: "",
    email: "",
    password: "",
    city: "",
    clinicName: "",
    clinicAddress: "",
    specialty: "",
    licenseNumber: "",
    acceptTerms: false,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }))
  const text = (key: keyof Values) => ({
    value: values[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key, e.target.value as never),
  })

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const found = validate(values, t)
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      const isDoctor = values.role === "doctor"
      const res = await authService.signUp({
        role: values.role,
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        city: values.city.trim(),
        acceptTerms: true,
        ...(isDoctor && {
          clinicName: values.clinicName.trim(),
          clinicAddress: values.clinicAddress.trim(),
          specialty: values.specialty.trim() || undefined,
          licenseNumber: values.licenseNumber.trim() || undefined,
        }),
      })
      router.push(`/verify-otp?email=${encodeURIComponent(res.email)}`)
    } catch (err) {
      cooldown.trip(err)
      if (!(err instanceof RateLimitError)) setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const isDoctor = values.role === "doctor"

  return (
    <div className="px-4 pt-10 pb-16 sm:px-6">
      <header className="mx-auto mb-8 flex max-w-[1040px] flex-wrap items-center justify-between gap-4">
        <Logo size={30} />
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[15px] text-muted-foreground">
            {t.auth.haveAccount}{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              {t.auth.loginTitle}
            </Link>
          </p>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <form
        onSubmit={onSubmit}
        noValidate
        className="mx-auto flex max-w-[1040px] flex-col gap-8 rounded-2xl border bg-card p-6 sm:p-10"
      >
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-[32px] font-semibold tracking-tight">{t.auth.signupTitle}</h1>
          <p className="text-[15px] text-muted-foreground">{t.auth.signupSubtitle}</p>
        </div>

        {error && <Alert>{error}</Alert>}
        <RateLimitNotice remaining={cooldown.remaining} />

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-sm font-semibold">{t.auth.iAmA}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <ChoiceCard
              name="role"
              value="patient"
              checked={values.role === "patient"}
              onChange={() => set("role", "patient")}
              title={t.common.patient}
              description={t.auth.patientRole}
            />
            <ChoiceCard
              name="role"
              value="doctor"
              checked={isDoctor}
              onChange={() => set("role", "doctor")}
              title={t.common.doctor}
              description={t.auth.doctorRole}
            />
          </div>
        </fieldset>

        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <Field label={t.auth.fullName} error={errors.name}>
            {(p) => <Input {...p} autoComplete="name" {...text("name")} />}
          </Field>
          <Field label={t.auth.email} error={errors.email}>
            {(p) => <Input {...p} type="email" autoComplete="email" {...text("email")} />}
          </Field>
          <Field label={t.auth.password} hint={t.auth.passwordHint} error={errors.password}>
            {(p) => <Input {...p} type="password" autoComplete="new-password" {...text("password")} />}
          </Field>
          <Field label={t.auth.city} error={errors.city}>
            {(p) => <Input {...p} autoComplete="address-level2" {...text("city")} />}
          </Field>
        </div>

        {isDoctor && (
          <section className="flex flex-col gap-4 border-t pt-6">
            <h2 className="text-base font-semibold">
              {t.auth.clinicDetails} <span className="font-normal text-muted-foreground">{t.auth.doctorsOnly}</span>
            </h2>
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <Field label={t.auth.clinicName} error={errors.clinicName}>
                {(p) => <Input {...p} {...text("clinicName")} />}
              </Field>
              <Field label={t.auth.clinicAddress} error={errors.clinicAddress}>
                {(p) => <Input {...p} placeholder={t.auth.clinicAddressPlaceholder} {...text("clinicAddress")} />}
              </Field>
              <Field label={t.auth.specialty} optional>
                {(p) => <Input {...p} {...text("specialty")} />}
              </Field>
              <Field label={t.auth.licenseNumber} optional>
                {(p) => <Input {...p} {...text("licenseNumber")} />}
              </Field>
            </div>
          </section>
        )}

        <div className="flex flex-col gap-1.5">
          <Checkbox checked={values.acceptTerms} onChange={(e) => set("acceptTerms", e.target.checked)}>
            {t.auth.consent}
          </Checkbox>
          {errors.acceptTerms && (
            <span className="ps-[30px] text-[13px] font-medium text-destructive">{errors.acceptTerms}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg" loading={busy} disabled={cooldown.active}>
            {t.auth.createAccountButton}
          </Button>
        </div>
      </form>
    </div>
  )
}
