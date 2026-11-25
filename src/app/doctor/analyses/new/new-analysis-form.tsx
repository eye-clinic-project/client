"use client"

/**
 * Upload a fundus image for a patient: pick patient (searchable), eye, capture
 * date, notes and the image. The analysis is queued and processed in the background.
 * A sidebar shows AI status and the current queue.
 */

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { ImagePreview } from "@/components/common/image-preview"
import { FileDrop } from "@/components/form/file-drop"
import { FormAlert } from "@/components/form/form-alert"
import { FormFieldError } from "@/components/form/form-error"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { TextareaField } from "@/components/form/textarea-field"
import { PageHeader } from "@/components/page/page-header"
import { Panel } from "@/components/page/panel"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { cn } from "@/lib/utils"
import { useCreateAnalysisMutation } from "@/services/analysis.service"
import {
  createAnalysisSchema,
  FUNDUS_TYPES,
  type CreateAnalysisInput,
} from "@/validation/analysis.schema"

import { AnalysisSidebar } from "./analysis-sidebar"
import { PatientPicker } from "./patient-picker"

export function NewAnalysisForm({
  initialPatientId,
}: {
  initialPatientId: string
}) {
  const t = useTranslations("analyses.create")
  const tc = useTranslations("common")
  const router = useRouter()
  const errorText = useErrorText()
  const [createAnalysis] = useCreateAnalysisMutation()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<CreateAnalysisInput, unknown, FormData>({
    resolver: zodResolver(createAnalysisSchema),
    defaultValues: {
      patientId: initialPatientId,
      eye: "left",
      capturedAt: "",
      notes: "",
      image: [],
    },
  })

  const onSubmit = form.handleSubmit(async (body) => {
    setError(null)
    try {
      await createAnalysis(body).unwrap()
      toast.success(t("queued"))
      router.push("/doctor/analyses")
    } catch (caught) {
      setError(errorText(caught))
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("lead")} />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel id="new-analysis" title={t("section")}>
          <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
            {error && <FormAlert>{error}</FormAlert>}
            <Controller
              control={form.control}
              name="patientId"
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <PatientPicker
                    value={field.value}
                    onChange={field.onChange}
                    invalid={fieldState.invalid}
                  />
                  <FormFieldError error={fieldState.error} />
                </div>
              )}
            />
            <Controller
              control={form.control}
              name="eye"
              render={({ field }) => (
                <fieldset className="flex flex-col gap-1.5">
                  <legend className="mb-1.5 text-sm font-medium">
                    {t("eye")}
                  </legend>
                  <div className="grid grid-cols-3 gap-2">
                    {(["left", "right", "unknown"] as const).map((eye) => (
                      <button
                        key={eye}
                        type="button"
                        aria-pressed={field.value === eye}
                        onClick={() => field.onChange(eye)}
                        className={cn(
                          "min-h-11 text-sm font-semibold",
                          field.value === eye
                            ? "border-2 border-brand bg-brand-soft text-brand-strong"
                            : "border border-border bg-background text-muted-foreground"
                        )}
                      >
                        {t(eye)}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
            />
            <TextField
              control={form.control}
              name="capturedAt"
              label={t("captured")}
              type="datetime-local"
              className="max-w-xs"
            />
            <TextareaField
              control={form.control}
              name="notes"
              label={t("notes")}
              rows={2}
            />
            <Controller
              control={form.control}
              name="image"
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-3">
                  <FileDrop
                    files={field.value}
                    onChange={field.onChange}
                    accept={FUNDUS_TYPES.join(",")}
                    max={1}
                    label={t("image")}
                    title={t("dropImage")}
                    hint={t("imageHint")}
                    invalid={fieldState.invalid}
                  />
                  {field.value[0] && (
                    <div className="flex justify-center bg-black p-2">
                      <ImagePreview
                        file={field.value[0]}
                        alt={t("image")}
                        className="max-h-80 w-full"
                      />
                    </div>
                  )}
                  <FormFieldError error={fieldState.error} />
                </div>
              )}
            />
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-5">
              <Link
                href="/doctor/analyses"
                className="inline-flex h-11 items-center border border-border px-4 text-sm font-semibold hover:bg-muted"
              >
                {tc("cancel")}
              </Link>
              <SubmitButton
                pending={form.formState.isSubmitting}
                className="h-11 w-auto px-5 text-sm"
              >
                {t("submit")}
              </SubmitButton>
            </div>
          </form>
        </Panel>
        <AnalysisSidebar />
      </div>
    </div>
  )
}
