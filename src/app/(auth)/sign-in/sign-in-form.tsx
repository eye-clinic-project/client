"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { GoogleButton } from "@/components/auth/google-button"
import { FormAlert } from "@/components/form/form-alert"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { signInErrorCode, type SignInErrorCode } from "@/util/auth-messages"
import { signInSchema } from "@/validation/auth.schema"

interface SignInFormProps {
  googleEnabled: boolean
  callbackUrl?: string
  defaultEmail: string
  notice: string | null
  initialError: SignInErrorCode | null
}

export function SignInForm({
  googleEnabled,
  callbackUrl,
  defaultEmail,
  notice,
  initialError,
}: SignInFormProps) {
  const router = useRouter()
  const t = useTranslations("auth")
  const tc = useTranslations("common")
  const [error, setError] = useState<SignInErrorCode | null>(initialError)
  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: defaultEmail, password: "" },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null)
    const result = await signIn("credentials", { ...values, redirect: false })

    if (!result?.error) {
      router.replace(callbackUrl ?? "/")
      router.refresh()
      return
    }

    if (result.code === "unverified") {
      router.push(
        `/verify-email?email=${encodeURIComponent(values.email)}&send=1`
      )
      return
    }
    setError(signInErrorCode(result.code ?? "unavailable"))
  })

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[30px] font-semibold tracking-[-0.01em]">
          {t("signIn.title")}
        </h2>
        <p className="text-[15px] text-muted-foreground">{t("signIn.lead")}</p>
      </div>

      {notice && !error && <FormAlert tone="success">{notice}</FormAlert>}
      {error && <FormAlert>{t(`errors.${error}`)}</FormAlert>}

      <TextField
        control={form.control}
        name="email"
        label={t("fields.email")}
        type="email"
        autoComplete="email"
        dir="ltr"
      />
      <TextField
        control={form.control}
        name="password"
        label={t("fields.password")}
        type="password"
        autoComplete="current-password"
        labelAction={
          <Link
            href="/forgot-password"
            className="text-[13px] font-medium text-brand hover:text-brand-strong"
          >
            {t("signIn.forgot")}
          </Link>
        }
      />

      <SubmitButton pending={form.formState.isSubmitting}>
        {t("signIn.submit")}
      </SubmitButton>

      {googleEnabled && (
        <>
          <div className="flex items-center gap-3 text-[13px] text-subtle">
            <span className="h-px flex-1 bg-border" />
            {tc("or")}
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleButton callbackUrl={callbackUrl} />
        </>
      )}
    </form>
  )
}
