"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { SendIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { FormAlert } from "@/components/form/form-alert"
import { OtpField } from "@/components/form/otp-field"
import { SubmitButton } from "@/components/form/submit-button"
import { useCountdown } from "@/hooks/use-countdown"
import { useErrorText } from "@/lib/i18n/use-error-text"
import {
  useSendVerificationEmailMutation,
  useVerifyEmailMutation,
} from "@/service/auth.service"
import { verifyEmailSchema } from "@/validation/auth.schema"

const RESEND_SECONDS = 60

export function VerifyEmailForm({
  email,
  sendOnMount,
}: {
  email: string
  sendOnMount: boolean
}) {
  const router = useRouter()
  const t = useTranslations("auth.verify")
  const errorMessage = useErrorText()
  const [verifyEmail] = useVerifyEmailMutation()
  const [sendCode, { isLoading: sending }] = useSendVerificationEmailMutation()
  const countdown = useCountdown(RESEND_SECONDS)
  const [error, setError] = useState<string | null>(null)
  const sentOnMount = useRef(false)
  const form = useForm({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email, code: "" },
  })

  const resend = async () => {
    try {
      await sendCode({ email }).unwrap()
      countdown.start()
      toast.success(t("resent"))
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  const { start } = countdown
  useEffect(() => {
    if (sentOnMount.current) return
    sentOnMount.current = true
    if (!sendOnMount) {
      start()
      return
    }
    sendCode({ email })
      .unwrap()
      .then(start, (caught: unknown) => setError(errorMessage(caught)))
  }, [email, errorMessage, sendCode, sendOnMount, start])

  const onSubmit = form.handleSubmit(async (payload) => {
    setError(null)
    try {
      await verifyEmail(payload).unwrap()
      router.replace(`/sign-in?verified=1&email=${encodeURIComponent(email)}`)
    } catch (caught) {
      setError(errorMessage(caught))
      form.resetField("code")
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-4 pt-2 text-center">
        <span className="inline-flex size-16 items-center justify-center bg-brand-soft text-brand">
          <SendIcon className="size-7" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">
          {t("title")}
        </h1>
        <p className="text-[15px] leading-normal text-muted-foreground">
          {t.rich("lead", {
            email,
            strong: (chunks) => (
              <strong className="text-foreground" dir="ltr">
                {chunks}
              </strong>
            ),
          })}
        </p>
      </div>

      {error && <FormAlert>{error}</FormAlert>}

      <OtpField control={form.control} name="code" srOnlyLabel />

      <SubmitButton pending={form.formState.isSubmitting}>
        {t("submit")}
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        {t("didntGet")}{" "}
        {countdown.active ? (
          <span className="text-subtle">
            {t("resendIn", { time: countdown.label })}
          </span>
        ) : (
          <button
            type="button"
            disabled={sending}
            onClick={() => void resend()}
            className="font-semibold text-brand hover:text-brand-strong disabled:opacity-50"
          >
            {t("resend")}
          </button>
        )}
      </p>
      <p className="text-center text-[13px] leading-normal text-subtle">
        {t("wrongAddress")}{" "}
        <Link
          href="/sign-up"
          className="font-semibold text-brand hover:text-brand-strong"
        >
          {t("again")}
        </Link>
      </p>
    </form>
  )
}
