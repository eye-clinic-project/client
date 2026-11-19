"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { FormAlert } from "@/components/form/form-alert"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { completeProfileSchema } from "@/validation/auth.schema"

export default function CompleteProfilePage() {
  const router = useRouter()
  const t = useTranslations("auth")
  const tc = useTranslations("common")
  const { update } = useSession()
  const [error, setError] = useState<string | null>(null)
  const form = useForm({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: { city: "" },
  })

  const onSubmit = form.handleSubmit(async ({ city }) => {
    setError(null)
    const session = await update({ kind: "complete-google", city })
    if (session?.accessToken && !session.error) {
      router.replace("/")
      router.refresh()
      return
    }
    setError(t("complete.failed"))
  })

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[30px] font-semibold tracking-[-0.01em]">
          {t("complete.title")}
        </h1>
        <p className="text-[15px] text-muted-foreground">
          {t("complete.lead")}
        </p>
      </div>
      {error && <FormAlert>{error}</FormAlert>}
      <TextField
        control={form.control}
        name="city"
        label={t("fields.city")}
        autoComplete="address-level2"
      />
      <SubmitButton pending={form.formState.isSubmitting}>
        {t("complete.submit")}
      </SubmitButton>
      <button
        type="button"
        onClick={() => void signOut({ redirectTo: "/sign-in" })}
        className="text-center text-sm font-semibold text-brand hover:text-brand-strong"
      >
        {tc("cancel")}
      </button>
    </form>
  )
}
