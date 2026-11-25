"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { FileDrop } from "@/components/form/file-drop"
import { FormAlert } from "@/components/form/form-alert"
import { FormFieldError } from "@/components/form/form-error"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { Button } from "@/components/ui/button"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { useSubmitLicenseMutation } from "@/services/doctor.service"
import type { DoctorVerification } from "@/types/api"
import { DOCUMENT_TYPES } from "@/validation/common.schema"
import { licenseSchema } from "@/validation/verification.schema"

/** License number + documents → PUT /doctor/me/verification. */
export function LicenseForm({
  verification,
  onDone,
  canCancel,
}: {
  verification: DoctorVerification
  onDone: () => void
  canCancel: boolean
}) {
  const t = useTranslations("verification")
  const ta = useTranslations("auth.files")
  const errorText = useErrorText()
  const [submit] = useSubmitLicenseMutation()
  const [error, setError] = useState<string | null>(null)
  const form = useForm({
    resolver: zodResolver(licenseSchema),
    defaultValues: {
      licenseNumber: verification.licenseNumber ?? "",
      documents: [] as File[],
    },
  })

  const onSubmit = form.handleSubmit(async (body) => {
    setError(null)
    try {
      await submit(body).unwrap()
      toast.success(t("submitted"))
      onDone()
    } catch (caught) {
      setError(errorText(caught))
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      {verification.status === "rejected" && !canCancel && (
        <div
          role="status"
          className="flex flex-col gap-1 border-s-[3px] border-danger bg-danger-soft px-4 py-3 text-sm"
        >
          <span className="font-semibold text-danger">
            {t("rejectedTitle")}
          </span>
          <span>
            {verification.rejectionReason &&
              `“${verification.rejectionReason}” `}
            {t("rejectedBody")}
          </span>
        </div>
      )}
      {error && <FormAlert>{error}</FormAlert>}
      <TextField
        control={form.control}
        name="licenseNumber"
        label={t("number")}
        description={t("numberHint")}
        dir="ltr"
        className="max-w-md"
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
              label={ta("label")}
              hint={ta("hint")}
              invalid={fieldState.invalid}
            />
            <FormFieldError error={fieldState.error} />
          </div>
        )}
      />
      <div className="flex flex-wrap justify-end gap-2">
        {canCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onDone}
            className="h-11 rounded-none px-4"
          >
            {t("cancelEdit")}
          </Button>
        )}
        <SubmitButton
          pending={form.formState.isSubmitting}
          className="h-11 w-auto px-5 text-sm"
        >
          {t("submit")}
        </SubmitButton>
      </div>
    </form>
  )
}
