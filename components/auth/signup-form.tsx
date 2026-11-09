"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

import { Alert, Button, Checkbox, ChoiceCard, Field, Input, Logo, RateLimitNotice } from "@/components/rc/ui"
import { ThemeToggle } from "@/components/theme-toggle"
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

function validate(v: Values) {
  const errors: Partial<Record<keyof Values, string>> = {}
  if (!v.name.trim()) errors.name = "Full name is required."
  if (!EMAIL.test(v.email.trim())) errors.email = "Enter a valid email address."
  if (v.password.length < 8) errors.password = "Password must be at least 8 characters."
  if (!v.city.trim()) errors.city = "City is required."
  if (v.role === "doctor") {
    if (!v.clinicName.trim()) errors.clinicName = "Clinic name is required."
    if (!v.clinicAddress.trim()) errors.clinicAddress = "Clinic address is required."
  }
  if (!v.acceptTerms) errors.acceptTerms = "Please accept the privacy policy to continue."
  return errors
}

export function SignupForm() {
  const router = useRouter()
  const cooldown = useCooldown()
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
    const found = validate(values)
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
        <div className="flex items-center gap-4">
          <p className="text-[15px] text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
          <ThemeToggle />
        </div>
      </header>

      <form
        onSubmit={onSubmit}
        noValidate
        className="mx-auto flex max-w-[1040px] flex-col gap-8 rounded-2xl border bg-card p-6 sm:p-10"
      >
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-[32px] font-semibold tracking-tight">Create your account</h1>
          <p className="text-[15px] text-muted-foreground">We will email you a 6-digit code to verify your address.</p>
        </div>

        {error && <Alert>{error}</Alert>}
        <RateLimitNotice remaining={cooldown.remaining} />

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-sm font-semibold">I am a…</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <ChoiceCard
              name="role"
              value="patient"
              checked={values.role === "patient"}
              onChange={() => set("role", "patient")}
              title="Patient"
              description="See your screening results, reports and book visits."
            />
            <ChoiceCard
              name="role"
              value="doctor"
              checked={isDoctor}
              onChange={() => set("role", "doctor")}
              title="Doctor"
              description="Manage patients, analyse fundus images and send reports."
            />
          </div>
        </fieldset>

        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <Field label="Full name" error={errors.name}>
            {(p) => <Input {...p} autoComplete="name" {...text("name")} />}
          </Field>
          <Field label="Email" error={errors.email}>
            {(p) => <Input {...p} type="email" autoComplete="email" {...text("email")} />}
          </Field>
          <Field label="Password" hint="At least 8 characters." error={errors.password}>
            {(p) => <Input {...p} type="password" autoComplete="new-password" {...text("password")} />}
          </Field>
          <Field label="City" error={errors.city}>
            {(p) => <Input {...p} autoComplete="address-level2" {...text("city")} />}
          </Field>
        </div>

        {isDoctor && (
          <section className="flex flex-col gap-4 border-t pt-6">
            <h2 className="text-base font-semibold">
              Clinic details <span className="font-normal text-muted-foreground">(doctors only)</span>
            </h2>
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <Field label="Clinic name" error={errors.clinicName}>
                {(p) => <Input {...p} {...text("clinicName")} />}
              </Field>
              <Field label="Clinic address" error={errors.clinicAddress}>
                {(p) => <Input {...p} placeholder="Street, area, city" {...text("clinicAddress")} />}
              </Field>
              <Field label="Specialty" optional>
                {(p) => <Input {...p} {...text("specialty")} />}
              </Field>
              <Field label="License number" optional>
                {(p) => <Input {...p} {...text("licenseNumber")} />}
              </Field>
            </div>
          </section>
        )}

        <div className="flex flex-col gap-1.5">
          <Checkbox checked={values.acceptTerms} onChange={(e) => set("acceptTerms", e.target.checked)}>
            I agree to the privacy policy and consent to my medical images and results being processed to provide this
            service. AI results are decision support and are confirmed by a doctor.
          </Checkbox>
          {errors.acceptTerms && (
            <span className="pl-[30px] text-[13px] font-medium text-destructive">{errors.acceptTerms}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg" loading={busy} disabled={cooldown.active}>
            Create account
          </Button>
        </div>
      </form>
    </div>
  )
}
