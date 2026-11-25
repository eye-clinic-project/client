"use client"

/**
 * Doctor's review of an AI result: agree/disagree, confirmed DR level (0–4),
 * notes, recommendations and follow-up date. Creates or updates the review, and
 * can create/open the report for this analysis.
 */

import { zodResolver } from "@hookform/resolvers/zod"
import { LockIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { FormAlert } from "@/components/form/form-alert"
import { FormFieldError } from "@/components/form/form-error"
import { TextField } from "@/components/form/text-field"
import { TextareaField } from "@/components/form/textarea-field"
import { Panel } from "@/components/page/panel"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { useAnalysisLabels } from "@/lib/i18n/use-labels"
import { cn } from "@/lib/utils"
import {
  useGetReviewQuery,
  useSaveReviewMutation,
  type ReviewPayload,
} from "@/services/analysis.service"
import { useCreateReportMutation } from "@/services/report.service"
import type { Analysis, DrLevel, Report, Review } from "@/types/api"
import { reviewSchema, type ReviewInput } from "@/validation/analysis.schema"

const LEVELS: DrLevel[] = [0, 1, 2, 3, 4]

export function ReviewForm({
  analysis,
  report,
  onReport,
}: {
  analysis: Analysis
  report: Report | null
  onReport: (id: string) => void
}) {
  const { data: review, isLoading } = useGetReviewQuery(analysis._id)
  if (isLoading) return <Skeleton className="h-80 w-full rounded-none" />
  return (
    // `key` re-creates the form when the saved review loads/changes, so default values refresh.
    <ReviewFormBody
      key={review?._id ?? "new"}
      analysis={analysis}
      review={review ?? null}
      report={report}
      onReport={onReport}
    />
  )
}

function ReviewFormBody({
  analysis,
  review,
  report,
  onReport,
}: {
  analysis: Analysis
  review: Review | null
  report: Report | null
  onReport: (id: string) => void
}) {
  const t = useTranslations("analyses.review")
  const errorText = useErrorText()
  const labels = useAnalysisLabels()
  const [saveReview] = useSaveReviewMutation()
  const [createReport] = useCreateReportMutation()
  const [error, setError] = useState<string | null>(null)
  const [intent, setIntent] = useState<"save" | "report">("save")
  const locked = report?.status === "sent"
  const form = useForm<ReviewInput, unknown, ReviewPayload>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      aiResultConfirmed: review?.aiResultConfirmed ?? null,
      confirmedLevel:
        review?.confirmedLevel ?? analysis.stage2.predictedLevel ?? null,
      notes: review?.notes ?? "",
      recommendations: review?.recommendations ?? "",
      followUpDate: review?.followUpDate
        ? review.followUpDate.slice(0, 10)
        : "",
    },
  })
  const level = useWatch({ control: form.control, name: "confirmedLevel" })

  const onSubmit = form.handleSubmit(async (body) => {
    setError(null)
    if (intent === "report" && !body.notes) {
      form.setError("notes", { message: "required" })
      setError(t("notesRequired"))
      return
    }
    try {
      await saveReview({
        analysisId: analysis._id,
        exists: review !== null,
        body,
      }).unwrap()
      if (intent === "save") {
        toast.success(t("saved"))
        return
      }
      if (report) {
        onReport(report._id)
        return
      }
      const created = await createReport({
        analysisId: analysis._id,
        title: t("defaultReportTitle", {
          eye: labels.eye(analysis.image?.eye),
        }),
        recommendations: body.recommendations,
      }).unwrap()
      onReport(created._id)
    } catch (caught) {
      setError(errorText(caught))
    }
  })

  const choice = (active: boolean) =>
    cn(
      "min-h-11 px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60",
      active
        ? "border-2 border-brand bg-brand-soft text-brand-strong"
        : "border border-border bg-background text-muted-foreground hover:text-foreground"
    )

  return (
    <Panel
      id="review"
      title={t("yourReview")}
      action={
        <span className="inline-flex items-center gap-1.5 text-xs text-subtle">
          <LockIcon className="size-3.5" aria-hidden="true" />
          {t("locked")}
        </span>
      }
    >
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        {locked && <FormAlert tone="info">{t("lockedNow")}</FormAlert>}
        {error && <FormAlert>{error}</FormAlert>}
        <fieldset disabled={locked} className="flex flex-col gap-5">
          <Controller
            control={form.control}
            name="aiResultConfirmed"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium" id="agree-label">
                  {t("agree")}
                </span>
                <div
                  role="group"
                  aria-labelledby="agree-label"
                  className="grid grid-cols-2 gap-2"
                >
                  <button
                    type="button"
                    aria-pressed={field.value === true}
                    onClick={() => field.onChange(true)}
                    className={choice(field.value === true)}
                  >
                    {t("agreeYes")}
                  </button>
                  <button
                    type="button"
                    aria-pressed={field.value === false}
                    onClick={() => field.onChange(false)}
                    className={choice(field.value === false)}
                  >
                    {t("agreeNo")}
                  </button>
                </div>
                <FormFieldError error={fieldState.error} />
              </div>
            )}
          />
          <Controller
            control={form.control}
            name="confirmedLevel"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium" id="grade-label">
                  {t("grade")}
                </span>
                <div
                  role="group"
                  aria-labelledby="grade-label"
                  className="grid grid-cols-2 gap-2 sm:grid-cols-5"
                >
                  {LEVELS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={field.value === value}
                      onClick={() => field.onChange(value)}
                      className={cn(
                        choice(field.value === value),
                        "flex flex-col items-center gap-0.5 py-2"
                      )}
                    >
                      <span className="text-base">{value}</span>
                      <span className="text-xs font-medium">
                        {labels.level(value)}
                      </span>
                    </button>
                  ))}
                </div>
                {level !== null && level !== undefined && (
                  <p className="text-xs text-subtle">
                    {t(`gradeHints.${level as DrLevel}`)}
                  </p>
                )}
                <FormFieldError error={fieldState.error} />
              </div>
            )}
          />
          <TextareaField
            control={form.control}
            name="notes"
            label={t("notes")}
            rows={3}
          />
          <TextareaField
            control={form.control}
            name="recommendations"
            label={t("recommendations")}
            rows={2}
          />
          <TextField
            control={form.control}
            name="followUpDate"
            label={t("followUp")}
            type="date"
            className="max-w-xs"
          />
        </fieldset>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-5">
          {locked && report ? (
            <Link
              href={`/doctor/reports/${report._id}`}
              className="inline-flex h-11 items-center bg-primary px-5 text-sm font-semibold text-primary-foreground"
            >
              {t("openReport")}
            </Link>
          ) : (
            <>
              <Button
                type="submit"
                variant="outline"
                disabled={form.formState.isSubmitting}
                onClick={() => setIntent("save")}
                className="h-11 rounded-none px-4"
              >
                {t("save")}
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                onClick={() => setIntent("report")}
                className="h-11 rounded-none px-5"
              >
                {report ? t("openReport") : t("saveAndReport")}
              </Button>
            </>
          )}
        </div>
      </form>
    </Panel>
  )
}
