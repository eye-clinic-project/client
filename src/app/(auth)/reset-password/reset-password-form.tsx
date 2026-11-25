"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { FormAlert } from "@/components/form/form-alert"
import { OtpField } from "@/components/form/otp-field"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { useResetPasswordMutation } from "@/service/auth.service"
import { resetPasswordSchema } from "@/validation/auth.schema"

export function ResetPasswordForm({ defaultEmail }: { defaultEmail: string }) {
  const router = useRouter()
  const t = useTranslations("auth")
  const errorMessage = useErrorText()
  const [resetPassword] = useResetPasswordMutation()
  const [error, setError] = useState<string | null>(null)
  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: defaultEmail,
      code: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = form.handleSubmit(async (payload) => {
    setError(null)
    try {
      await resetPassword(payload).unwrap()
      router.replace(
        `/sign-in?reset=1&email=${encodeURIComponent(payload.email)}`
      )
    } catch (caught) {
      setError(errorMessage(caught))
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[30px] font-semibold tracking-[-0.01em]">
          {t("reset.title")}
        </h1>
        <p className="text-[15px] text-muted-foreground">{t("reset.lead")}</p>
      </div>
      {error && <FormAlert>{error}</FormAlert>}
      <TextField
        control={form.control}
        name="email"
        label={t("fields.email")}
        dir="ltr"
        type="email"
        autoComplete="email"
      />
      <OtpField control={form.control} name="code" />
      <TextField
        control={form.control}
        name="password"
        label={t("fields.newPassword")}
        type="password"
        autoComplete="new-password"
        description={t("fields.passwordHint")}
      />
      <TextField
        control={form.control}
        name="confirmPassword"
        label={t("fields.confirmPassword")}
        type="password"
        autoComplete="new-password"
      />
      <SubmitButton pending={form.formState.isSubmitting}>
        {t("reset.submit")}
      </SubmitButton>
      <Link
        href="/forgot-password"
        className="text-center text-sm font-semibold text-brand hover:text-brand-strong"
      >
        {t("reset.newCode")}
      </Link>
    </form>
  )
}
