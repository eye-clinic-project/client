"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CheckIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { FileDrop } from "@/components/form/file-drop"
import { FormAlert } from "@/components/form/form-alert"
import { FormFieldError } from "@/components/form/form-error"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { PageHeader } from "@/components/page/page-header"
import { DetailList, Panel } from "@/components/page/panel"
import { ErrorState } from "@/components/page/states"
import { verificationTone } from "@/components/settings/license-section"
import { StatusChip } from "@/components/status-chip"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { openProtectedFile } from "@/lib/api/protected-file"
import { useFormat } from "@/lib/i18n/use-labels"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { cn } from "@/lib/utils"
import {
  useGetMyClinicQuery,
  useGetMyVerificationQuery,
  useSubmitLicenseMutation,
} from "@/service/doctor.service"
import type { DoctorVerification } from "@/types/api"
import { licenseSchema } from "@/validation/verification.schema"
import { DOCUMENT_TYPES } from "@/validation/common.schema"

type StepState = "done" | "current" | "todo" | "failed"

export function VerificationView() {
  const t = useTranslations("verification")
  const format = useFormat()
  const {
    data: verification,
    isLoading,
    isError,
    refetch,
  } = useGetMyVerificationQuery()
  const { data: clinic } = useGetMyClinicQuery()
  const [editing, setEditing] = useState(false)

  if (isLoading) return <Skeleton className="h-96 w-full rounded-none" />
  if (isError || !verification) return <ErrorState onRetry={refetch} />

  const submitted = Boolean(verification.submittedAt)
  const status = verification.status
  const showForm = editing || !submitted || status === "rejected"
  const steps: { title: string; detail: string; state: StepState }[] = [
    { title: t("step1"), detail: t("step1Detail"), state: "done" },
    {
      title: t("step2"),
      detail:
        submitted && verification.submittedAt
          ? t("step2Detail", { date: format.date(verification.submittedAt) })
          : t("step2Todo"),
      state: submitted && status !== "rejected" ? "done" : "current",
    },
    {
      title: t("step3"),
      detail:
        status === "rejected"
          ? t("step3Rejected", {
              date: format.date(
                verification.verifiedAt ??
                  verification.submittedAt ??
                  new Date()
              ),
            })
          : status === "approved"
            ? format.date(verification.verifiedAt ?? new Date())
            : submitted
              ? t("step3Pending")
              : t("step3Todo"),
      state:
        status === "approved"
          ? "done"
          : status === "rejected"
            ? "failed"
            : submitted
              ? "current"
              : "todo",
    },
    {
      title: t("step4"),
      detail: t("step4Detail"),
      state: status === "approved" ? "done" : "todo",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("lead")} />
      <ol
        aria-label={t("steps")}
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {steps.map((step, index) => (
          <li
            key={step.title}
            aria-current={step.state === "current" ? "step" : undefined}
            className={cn(
              "flex items-start gap-3 border-t-[3px] bg-card p-4",
              step.state === "done"
                ? "border-success"
                : step.state === "current"
                  ? "border-brand"
                  : step.state === "failed"
                    ? "border-danger"
                    : "border-border"
            )}
          >
            <span
              className={cn(
                "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                step.state === "done"
                  ? "bg-success text-white"
                  : step.state === "current"
                    ? "bg-brand text-white"
                    : step.state === "failed"
                      ? "bg-danger text-white"
                      : "bg-muted text-subtle"
              )}
              aria-hidden="true"
            >
              {step.state === "done" ? (
                <CheckIcon className="size-4" />
              ) : (
                index + 1
              )}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">{step.title}</span>
              <span className="text-xs text-subtle">{step.detail}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel id="license" title={t("details")}>
          {showForm ? (
            <LicenseForm
              verification={verification}
              onDone={() => setEditing(false)}
              canCancel={editing}
            />
          ) : (
            <SubmissionSummary
              verification={verification}
              onReplace={() => setEditing(true)}
            />
          )}
        </Panel>
        <div className="flex flex-col gap-4">
          <Panel title={t("untilTitle")}>
            <ul className="flex list-disc flex-col gap-2 ps-5 text-sm leading-relaxed text-muted-foreground">
              <li>{t("until1")}</li>
              <li>{t("until2")}</li>
              <li>{t("until3")}</li>
            </ul>
          </Panel>
          {clinic && (
            <Panel
              title={t("clinic")}
              action={
                <Link
                  href="/doctor/settings#clinic"
                  className="text-[13px] font-semibold text-brand hover:text-brand-strong"
                >
                  {t("editClinic")}
                </Link>
              }
            >
              <p className="text-sm font-semibold">{clinic.clinicName}</p>
              <p className="text-sm text-muted-foreground">
                {[clinic.clinicAddress, clinic.specialty]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}

function SubmissionSummary({
  verification,
  onReplace,
}: {
  verification: DoctorVerification
  onReplace: () => void
}) {
  const t = useTranslations("verification")
  const format = useFormat()
  const errorText = useErrorText()
  const approved = verification.status === "approved"
  return (
    <div className="flex flex-col gap-5">
      <div
        role="status"
        className={cn(
          "flex flex-col gap-1 border-s-[3px] px-4 py-3 text-sm",
          approved
            ? "border-success bg-success-soft"
            : "border-warning bg-warning-soft"
        )}
      >
        <span className="font-semibold">
          {approved ? t("approvedTitle") : t("pendingTitle")}
        </span>
        <span className="leading-relaxed text-muted-foreground">
          {approved
            ? t("approvedBody", {
                date: format.date(verification.verifiedAt ?? new Date()),
              })
            : t("pendingBody", {
                date: format.dateTime(verification.submittedAt ?? new Date()),
              })}
        </span>
      </div>
      <DetailList
        items={[
          {
            label: t("number"),
            value: <span dir="ltr">{verification.licenseNumber}</span>,
          },
          {
            label: t("statusLabel"),
            value: (
              <StatusChip tone={verificationTone(verification.status)}>
                {t(`status.${verification.status ?? "none"}`)}
              </StatusChip>
            ),
          },
          {
            label: t("documents"),
            value: (
              <span className="flex flex-col gap-1">
                {verification.documents.map((document) => (
                  <button
                    key={document.index}
                    type="button"
                    dir="auto"
                    onClick={() =>
                      openProtectedFile(
                        `/doctor/me/verification/documents/${document.index}`
                      ).catch((caught: unknown) =>
                        toast.error(errorText(caught))
                      )
                    }
                    className="text-start text-brand hover:text-brand-strong hover:underline"
                  >
                    {document.originalName}
                  </button>
                ))}
              </span>
            ),
          },
        ]}
      />
      <Button
        variant="outline"
        onClick={onReplace}
        className="h-10 self-start rounded-none px-4"
      >
        {t("replace")}
      </Button>
    </div>
  )
}

function LicenseForm({
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
