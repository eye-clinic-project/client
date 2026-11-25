"use client"

/** /forgot-password — request a password reset code by email, then go to /reset-password. */

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { FormAlert } from "@/components/form/form-alert"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { useForgotPasswordMutation } from "@/services/auth.service"
import { emailSchema } from "@/validation/auth.schema"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const t = useTranslations("auth")
  const errorMessage = useErrorText()
  const [forgotPassword] = useForgotPasswordMutation()
  const [error, setError] = useState<string | null>(null)
  const form = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  })

  const onSubmit = form.handleSubmit(async (payload) => {
    setError(null)
    try {
      await forgotPassword(payload).unwrap()
      router.push(`/reset-password?email=${encodeURIComponent(payload.email)}`)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[30px] font-semibold tracking-[-0.01em]">
          {t("forgot.title")}
        </h1>
        <p className="text-[15px] text-muted-foreground">{t("forgot.lead")}</p>
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
      <SubmitButton pending={form.formState.isSubmitting}>
        {t("forgot.submit")}
      </SubmitButton>
      <Link
        href="/sign-in"
        className="text-center text-sm font-semibold text-brand hover:text-brand-strong"
      >
        {t("forgot.back")}
      </Link>
    </form>
  )
}
