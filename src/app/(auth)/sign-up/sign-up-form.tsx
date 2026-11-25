"use client"

/**
 * Sign-up form, in up to two steps:
 * 1. account: role, name, city, email, password (+ clinic info for doctors)
 * 2. license (doctors only): license number and 1–3 documents
 *
 * The account is created right away. License files can't be uploaded yet (no
 * session), so they are saved in the browser (lib/license-draft.ts) and uploaded
 * automatically after the first sign-in. Next stop: /verify-email.
 */

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeftIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form"

import { GoogleButton } from "@/components/auth/google-button"
import { FileDrop } from "@/components/form/file-drop"
import { FormAlert } from "@/components/form/form-alert"
import { FormFieldError } from "@/components/form/form-error"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { saveLicenseDraft } from "@/lib/license-draft"
import { cn } from "@/lib/utils"
import { useSignUpMutation } from "@/services/auth.service"
import { signUpSchema, type SignUpInput } from "@/validation/auth.schema"
import { DOCUMENT_TYPES } from "@/validation/common.schema"

const DEFAULTS: SignUpInput = {
  role: "patient",
  name: "",
  city: "",
  email: "",
  password: "",
  acceptTerms: false,
  clinicName: "",
  clinicAddress: "",
  licenseNumber: "",
  specialty: "",
  documents: [],
}

/** Fields on step 1. Validated before moving to step 2, and used to jump back on errors. */
const ACCOUNT_FIELDS: FieldPath<SignUpInput>[] = [
  "name",
  "city",
  "email",
  "password",
  "clinicName",
  "clinicAddress",
  "acceptTerms",
]

export function SignUpForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter()
  const t = useTranslations("auth")
  const tc = useTranslations("common")

  const errorText = useErrorText()
  const [signUp] = useSignUpMutation()
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<"account" | "license">("account")
  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: DEFAULTS,
  })
  const role = useWatch({ control: form.control, name: "role" })
  const isDoctor = role === "doctor"

  const onSubmit = form.handleSubmit(
    async ({ account, license }) => {
      setError(null)
      try {
        await signUp(account).unwrap()
        if (license) {
          await saveLicenseDraft({ email: account.email, ...license })
        }
        router.push(`/verify-email?email=${encodeURIComponent(account.email)}`)
      } catch (caught) {
        setError(errorText(caught))
      }
    },
    // Submit failed validation: if a step-1 field is wrong, show step 1 again.
    (errors) => {
      if (ACCOUNT_FIELDS.some((field) => field in errors)) setStep("account")
    }
  )

  const goToLicense = async () => {
    const valid = await form.trigger(ACCOUNT_FIELDS)
    if (valid) setStep("license")
  }

  const roleButton = (value: SignUpInput["role"]) => (
    <button
      type="button"
      aria-pressed={role === value}
      onClick={() => {
        form.setValue("role", value, {
          shouldValidate: form.formState.isSubmitted,
        })
        setStep("account")
      }}
      className={cn(
        "min-h-[46px] text-[15px] font-semibold",
        role === value
          ? "border-2 border-brand bg-brand-soft text-brand-strong"
          : "border border-border bg-background text-muted-foreground"
      )}
    >
      {t(`signUp.${value}`)}
    </button>
  )

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[30px] font-semibold tracking-[-0.01em]">
          {step === "license" ? t("signUp.licenseTitle") : t("signUp.title")}
        </h2>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          {step === "license" ? t("signUp.licenseLead") : t("signUp.lead")}
        </p>
      </div>

      {isDoctor && (
        <ol
          aria-label={t("signUp.steps")}
          className="grid grid-cols-2 gap-2 text-[13px] font-semibold"
        >
          {(["account", "license"] as const).map((value, index) => (
            <li
              key={value}
              aria-current={step === value ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 border-t-2 pt-2",
                step === value
                  ? "border-brand text-brand-strong"
                  : "border-border text-subtle"
              )}
            >
              <span className="sr-only">
                {t("signUp.stepOf", { current: index + 1, total: 2 })}
              </span>
              <span aria-hidden="true">{index + 1}</span>
              {value === "account"
                ? t("signUp.stepAccount")
                : t("signUp.stepLicense")}
            </li>
          ))}
        </ol>
      )}

      {error && <FormAlert>{error}</FormAlert>}

      <div
        className={cn(
          "flex flex-col gap-[18px]",
          step === "license" && "hidden"
        )}
      >
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="mb-1.5 text-sm font-medium">
            {t("signUp.iAm")}
          </legend>
          {roleButton("patient")}
          {roleButton("doctor")}
        </fieldset>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField
            control={form.control}
            name="name"
            label={t("fields.name")}
            autoComplete="name"
          />
          <TextField
            control={form.control}
            name="city"
            label={t("fields.city")}
            autoComplete="address-level2"
          />
        </div>
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
          autoComplete="new-password"
          description={t("fields.passwordHint")}
        />

        {isDoctor && (
          <div className="flex flex-col gap-3 bg-brand-soft p-4">
            <span className="text-[13px] font-semibold text-brand-strong">
              {t("signUp.clinic")}
            </span>
            <TextField
              control={form.control}
              name="clinicName"
              label={t("fields.clinicName")}
              autoComplete="organization"
            />
            <TextField
              control={form.control}
              name="clinicAddress"
              label={t("fields.clinicAddress")}
              autoComplete="street-address"
            />
            <TextField
              control={form.control}
              name="specialty"
              label={t("fields.specialty")}
            />
          </div>
        )}

        <Controller
          control={form.control}
          name="acceptTerms"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-1.5">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="acceptTerms"
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                  aria-invalid={fieldState.invalid}
                  className="mt-0.5 size-[18px] rounded-none"
                />
                <FieldLabel
                  htmlFor="acceptTerms"
                  className="text-sm leading-normal font-normal text-muted-foreground"
                >
                  {t("signUp.terms")}
                </FieldLabel>
              </div>
              <FormFieldError error={fieldState.error} />
            </Field>
          )}
        />

        {isDoctor ? (
          <Button
            type="button"
            onClick={() => void goToLicense()}
            className="h-12 w-full rounded-none text-[15px] font-semibold"
          >
            {t("signUp.continue")}
          </Button>
        ) : (
          <SubmitButton pending={form.formState.isSubmitting}>
            {t("signUp.submit")}
          </SubmitButton>
        )}
      </div>

      {isDoctor && step === "license" && (
        <div className="flex flex-col gap-[18px]">
          <TextField
            control={form.control}
            name="licenseNumber"
            label={t("fields.licenseNumber")}
            description={t("signUp.licenseHint")}
            dir="ltr"
          />
          <Controller
            control={form.control}
            name="documents"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1.5">
                <FileDrop
                  files={field.value}
                  onChange={field.onChange}
                  accept={DOCUMENT_TYPES.join(",")}
                  max={3}
                  label={t("files.label")}
                  hint={t("files.hint")}
                  invalid={fieldState.invalid}
                />
                <FormFieldError error={fieldState.error} />
              </div>
            )}
          />
          <FormAlert tone="info">{t("signUp.licenseNote")}</FormAlert>
          <SubmitButton pending={form.formState.isSubmitting}>
            {t("signUp.submit")}
          </SubmitButton>
          <button
            type="button"
            onClick={() => setStep("account")}
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-brand hover:text-brand-strong"
          >
            <ArrowLeftIcon
              className="size-4 rtl:rotate-180"
              aria-hidden="true"
            />
            {t("signUp.back")}
          </button>
        </div>
      )}

      {googleEnabled && !isDoctor && (
        <>
          <div className="flex items-center gap-3 text-[13px] text-subtle">
            <span className="h-px flex-1 bg-border" />
            {tc("or")}
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleButton />
        </>
      )}
    </form>
  )
}
