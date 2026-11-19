"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { InfoIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { FileDrop } from "@/components/form/file-drop"
import { FormAlert } from "@/components/form/form-alert"
import { FormFieldError } from "@/components/form/form-error"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { TextareaField } from "@/components/form/textarea-field"
import { ImagePreview } from "@/components/image-preview"
import { PageHeader } from "@/components/page/page-header"
import { Panel } from "@/components/page/panel"
import { SearchInput } from "@/components/page/search-input"
import { StatusChip } from "@/components/status-chip"
import { UserAvatar } from "@/components/user-avatar"
import { useDebounced } from "@/hooks/use-debounced"
import { ageFrom, useAnalysisLabels } from "@/lib/i18n/use-labels"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { cn } from "@/lib/utils"
import {
  useCreateAnalysisMutation,
  useGetAiHealthQuery,
  useListAnalysesQuery,
} from "@/service/analysis.service"
import {
  useGetPatientQuery,
  useListPatientsQuery,
} from "@/service/patient.service"
import {
  createAnalysisSchema,
  FUNDUS_TYPES,
  type CreateAnalysisInput,
} from "@/validation/analysis.schema"

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

function PatientPicker({
  value,
  onChange,
  invalid,
}: {
  value: string
  onChange: (id: string) => void
  invalid: boolean
}) {
  const t = useTranslations("analyses.create")
  const tc = useTranslations("common")
  const [search, setSearch] = useState("")
  const debounced = useDebounced(search.trim())
  const { data: selected } = useGetPatientQuery(value, { skip: !value })
  const { data, isFetching } = useListPatientsQuery(
    { search: debounced || undefined, size: 8 },
    { skip: Boolean(value) }
  )

  if (value && selected) {
    const age = ageFrom(selected.dateOfBirth)
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t("patient")}</span>
        <div className="flex items-center gap-3 border border-border bg-surface px-3 py-2.5">
          <UserAvatar name={selected.user.name} src={selected.user.avatarUrl} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-semibold">{selected.user.name}</span>
            <span className="truncate text-xs text-subtle">
              <span dir="ltr">{selected.medicalRecordNumber}</span>
              {age !== null && ` · ${tc("yearsOld", { count: age })}`}
              {selected.gender && ` · ${tc(`gender.${selected.gender}`)}`}
            </span>
          </span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[13px] font-semibold text-brand hover:text-brand-strong"
          >
            {t("change")}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{t("patient")}</span>
      <SearchInput
        label={t("patientSearch")}
        placeholder={t("patientSearch")}
        value={search}
        onChange={setSearch}
        className={invalid ? "border-destructive" : undefined}
      />
      <ul
        className="flex max-h-64 flex-col overflow-y-auto border border-b-0 border-border"
        aria-busy={isFetching}
      >
        {data?.docs.length === 0 && (
          <li className="border-b border-border px-3 py-3 text-sm text-subtle">
            {t("noPatients")}
          </li>
        )}
        {data?.docs.map((patient) => (
          <li key={patient._id} className="border-b border-border">
            <button
              type="button"
              onClick={() => onChange(patient._id)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-start hover:bg-muted"
            >
              <UserAvatar
                name={patient.user.name}
                src={patient.user.avatarUrl}
              />
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold">
                  {patient.user.name}
                </span>
                <span className="text-xs text-subtle" dir="ltr">
                  {patient.medicalRecordNumber}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-subtle">{t("patientHint")}</p>
    </div>
  )
}

function AnalysisSidebar() {
  const t = useTranslations("analyses.create")
  const labels = useAnalysisLabels()
  const { data: health } = useGetAiHealthQuery(undefined, {
    pollingInterval: 60_000,
  })
  const { data: pending } = useListAnalysesQuery(
    { status: "pending", size: 5 },
    { pollingInterval: 15_000 }
  )
  const { data: processing } = useListAnalysesQuery(
    { status: "processing", size: 5 },
    { pollingInterval: 15_000 }
  )
  const queue = [
    ...new Map(
      [...(processing?.docs ?? []), ...(pending?.docs ?? [])].map(
        (analysis) => [analysis._id, analysis] as const
      )
    ).values(),
  ]

  return (
    <div className="flex flex-col gap-4">
      <Panel
        title={t("aiService")}
        action={
          health && (
            <StatusChip
              tone={
                health.available
                  ? health.mode === "mock"
                    ? "warning"
                    : "success"
                  : "danger"
              }
            >
              {health.available
                ? health.mode === "mock"
                  ? t("mock")
                  : t("online")
                : t("offline")}
            </StatusChip>
          )
        }
      >
        <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          {health?.modelVersion && (
            <li dir="auto">{t("model", { version: health.modelVersion })}</li>
          )}
          {health?.error && <li className="text-danger">{health.error}</li>}
          <li>{t("stage2Missing")}</li>
        </ul>
      </Panel>
      <Panel
        title={t("queue")}
        action={
          <Link
            href="/doctor/analyses"
            className="text-[13px] font-semibold text-brand hover:text-brand-strong"
          >
            {t("allAnalyses")}
          </Link>
        }
        bodyClassName="p-0"
      >
        {queue.length === 0 ? (
          <p className="px-5 py-4 text-sm text-subtle">{t("queueEmpty")}</p>
        ) : (
          <ul className="flex flex-col">
            {queue.map((analysis) => {
              const status = labels.status(analysis)
              return (
                <li
                  key={analysis._id}
                  className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 last:border-b-0"
                >
                  <span className="min-w-0 text-sm">
                    <span className="font-semibold">
                      {analysis.patient?.name}
                    </span>
                    <span className="text-subtle">
                      {" "}
                      · {labels.eye(analysis.image?.eye)}
                    </span>
                  </span>
                  <StatusChip tone={status.tone}>{status.label}</StatusChip>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
      <div
        role="status"
        className="flex gap-3 border-s-[3px] border-brand bg-brand-soft px-4 py-3.5 text-sm"
      >
        <InfoIcon
          className="mt-0.5 size-4 shrink-0 text-brand-strong"
          aria-hidden="true"
        />
        <span className="flex flex-col gap-1">
          <span className="font-semibold text-brand-strong">
            {t("nextTitle")}
          </span>
          <span className="leading-relaxed text-foreground">
            {t("nextBody")}
          </span>
        </span>
      </div>
    </div>
  )
}
