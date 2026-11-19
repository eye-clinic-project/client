"use client"

import { ExternalLinkIcon, RotateCcwIcon, Trash2Icon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/page/confirm-dialog"
import { DetailList, Panel } from "@/components/page/panel"
import { ErrorState } from "@/components/page/states"
import { ProtectedImage } from "@/components/protected-image"
import { StatusChip } from "@/components/status-chip"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { UserAvatar } from "@/components/user-avatar"
import { usePatientByUser } from "@/hooks/use-patient-by-user"
import { openProtectedFile } from "@/lib/api/protected-file"
import { ageFrom, useAnalysisLabels, useFormat } from "@/lib/i18n/use-labels"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { cn } from "@/lib/utils"
import {
  useDeleteAnalysisMutation,
  useGetAnalysisQuery,
  useRetryAnalysisMutation,
} from "@/service/analysis.service"
import { useListReportsQuery } from "@/service/report.service"
import type { Analysis } from "@/types/api"
import { formatBytes } from "@/util/format"
import { ReviewForm } from "./review-form"

export function AnalysisReview({ id }: { id: string }) {
  const t = useTranslations("analyses.review")
  const tc = useTranslations("common")
  const router = useRouter()
  const errorText = useErrorText()
  const labels = useAnalysisLabels()
  const {
    data: analysis,
    isLoading,
    isError,
    refetch,
  } = useGetAnalysisQuery(id)
  const running =
    analysis?.status === "pending" || analysis?.status === "processing"
  useGetAnalysisQuery(id, { skip: !running, pollingInterval: 5_000 })
  const { patient } = usePatientByUser(analysis?.patient)
  const { data: reports } = useListReportsQuery(
    { patientId: patient?._id, size: 50 },
    { skip: !patient }
  )
  const [retry, { isLoading: retrying }] = useRetryAnalysisMutation()
  const [remove, { isLoading: removing }] = useDeleteAnalysisMutation()
  const [confirming, setConfirming] = useState(false)

  if (isLoading) return <Skeleton className="h-96 w-full rounded-none" />
  if (isError || !analysis) return <ErrorState onRetry={refetch} />

  const report =
    reports?.docs.find((item) => item.analysis === analysis._id) ?? null
  const status = labels.status(analysis)
  const review = labels.review(analysis)
  const age = ageFrom(patient?.dateOfBirth)
  const meta = [
    patient ? t("meta", { mrn: patient.medicalRecordNumber }) : null,
    age !== null ? tc("yearsOld", { count: age }) : null,
    patient?.gender ? tc(`gender.${patient.gender}`) : null,
    labels.eye(analysis.image?.eye),
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <UserAvatar
            name={analysis.patient?.name ?? "?"}
            src={analysis.patient?.avatarUrl ?? null}
            className="size-12"
          />
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em]">
                {patient ? (
                  <Link
                    href={`/doctor/patients/${patient._id}`}
                    className="hover:underline"
                  >
                    {analysis.patient?.name}
                  </Link>
                ) : (
                  analysis.patient?.name
                )}
              </h1>
              <StatusChip tone={status.tone}>{status.label}</StatusChip>
              {review && (
                <StatusChip tone={review.tone}>{review.label}</StatusChip>
              )}
            </div>
            <p className="text-sm text-subtle">{meta.join(" · ")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              openProtectedFile(`/analysis/${analysis._id}/image`).catch(
                (caught: unknown) => toast.error(errorText(caught))
              )
            }
            className="h-10 gap-2 rounded-none px-4"
          >
            <ExternalLinkIcon className="size-4" aria-hidden="true" />
            {t("originalImage")}
          </Button>
          {analysis.status === "failed" && (
            <Button
              variant="outline"
              disabled={retrying}
              onClick={async () => {
                try {
                  await retry(analysis._id).unwrap()
                  toast.success(t("retried"))
                  void refetch()
                } catch (caught) {
                  toast.error(errorText(caught))
                }
              }}
              className="h-10 gap-2 rounded-none px-4"
            >
              <RotateCcwIcon className="size-4" aria-hidden="true" />
              {t("retry")}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setConfirming(true)}
            className="h-10 gap-2 rounded-none px-4 text-danger hover:text-danger"
          >
            <Trash2Icon className="size-4" aria-hidden="true" />
            {t("delete")}
          </Button>
        </div>
      </header>

      {analysis.isMock && (
        <p
          role="note"
          className="border border-warning/30 bg-warning-soft px-4 py-2.5 text-sm text-warning"
        >
          {t("mockNotice")}
        </p>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <ImagePanel analysis={analysis} />
        <div className="flex min-w-0 flex-col gap-6">
          <Stage1Panel analysis={analysis} />
          <Panel title={t("stage2")}>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {analysis.stage2.available && analysis.stage2.label
                ? t("stage2Predicted", { label: analysis.stage2.label })
                : t("stage2Missing")}
            </p>
          </Panel>
          {analysis.status === "completed" && (
            <ReviewForm
              analysis={analysis}
              report={report}
              onReport={(reportId) =>
                router.push(`/doctor/reports/${reportId}`)
              }
            />
          )}
          <HistoryPanel analysis={analysis} />
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("deleteTitle")}
        description={t("deleteBody")}
        confirmLabel={t("delete")}
        destructive
        pending={removing}
        onConfirm={async () => {
          try {
            await remove(analysis._id).unwrap()
            toast.success(t("deleted"))
            router.replace("/doctor/analyses")
          } catch (caught) {
            toast.error(errorText(caught))
          }
        }}
      />
    </div>
  )
}

function ImagePanel({ analysis }: { analysis: Analysis }) {
  const t = useTranslations("analyses.review")
  const tc = useTranslations("common")
  const format = useFormat()
  const [view, setView] = useState<"original" | "cam">("original")
  const showCam = view === "cam" && analysis.hasGradCam
  const toggle = (
    value: "original" | "cam",
    label: string,
    disabled = false
  ) => (
    <button
      type="button"
      aria-pressed={view === value}
      disabled={disabled}
      onClick={() => setView(value)}
      className={cn(
        "min-h-8 px-3 text-[13px] font-semibold disabled:opacity-40",
        view === value
          ? "bg-background text-foreground shadow-[0_1px_2px_rgba(15,30,38,0.12)]"
          : "text-muted-foreground"
      )}
    >
      {label}
    </button>
  )

  return (
    <Panel
      id="image"
      title={t("image")}
      action={
        <div
          role="group"
          aria-label={t("imageView")}
          className="inline-flex gap-1 bg-muted p-1"
        >
          {toggle("original", t("original"))}
          {toggle("cam", t("gradCam"), !analysis.hasGradCam)}
        </div>
      }
      bodyClassName="gap-4"
    >
      <figure className="flex flex-col gap-2">
        <div className="flex aspect-square items-center justify-center bg-black">
          <ProtectedImage
            path={
              showCam
                ? `/analysis/${analysis._id}/grad-cam`
                : `/analysis/${analysis._id}/image`
            }
            alt={showCam ? t("gradCam") : t("image")}
            className="size-full"
          />
        </div>
        <figcaption className="text-xs text-subtle">
          {showCam
            ? t("gradCamCaption")
            : analysis.hasGradCam
              ? t("originalCaption")
              : t("noGradCam")}
        </figcaption>
      </figure>
      <DetailList
        items={[
          {
            label: t("captured"),
            value: analysis.image?.capturedAt
              ? format.dateTime(analysis.image.capturedAt)
              : tc("none"),
          },
          {
            label: t("file"),
            value: analysis.image?.mimeType
              ? [
                  analysis.image.mimeType.split("/")[1]?.toUpperCase(),
                  analysis.image.size ? formatBytes(analysis.image.size) : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : tc("none"),
          },
          {
            label: t("model"),
            value: analysis.modelVersion ? (
              <span dir="ltr">{analysis.modelVersion}</span>
            ) : (
              tc("none")
            ),
          },
          {
            label: t("processing"),
            value:
              analysis.processingMs !== null
                ? t("processingValue", {
                    seconds: format.number(
                      Math.round(analysis.processingMs / 100) / 10
                    ),
                    attempt: analysis.attempts,
                  })
                : tc("none"),
          },
          ...(analysis.image?.notes
            ? [{ label: tc("optional"), value: analysis.image.notes }]
            : []),
        ]}
      />
    </Panel>
  )
}

function Stage1Panel({ analysis }: { analysis: Analysis }) {
  const t = useTranslations("analyses.review")
  const format = useFormat()

  if (analysis.status === "pending" || analysis.status === "processing") {
    return (
      <Panel title={t("stage1")}>
        <p role="status" className="text-sm text-muted-foreground">
          {t("inProgress")}
        </p>
      </Panel>
    )
  }
  if (analysis.status === "failed") {
    return (
      <Panel title={t("stage1")}>
        <div
          role="alert"
          className="flex flex-col gap-1 border-s-[3px] border-danger bg-danger-soft px-4 py-3"
        >
          <span className="font-semibold text-danger">{t("failed")}</span>
          {analysis.error && <span className="text-sm">{analysis.error}</span>}
        </div>
      </Panel>
    )
  }

  const confidence = analysis.stage1.confidence ?? 0
  const drFinding = analysis.stage1.findings.find(
    (finding) => finding.code === "D"
  )
  const hasDR = Boolean(analysis.stage1.hasDR)

  return (
    <Panel
      title={t("stage1")}
      action={<span className="text-xs text-subtle">{t("stage1Hint")}</span>}
      bodyClassName="gap-5"
    >
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-4 border-s-[3px] px-4 py-3.5",
          hasDR
            ? "border-danger bg-danger-soft"
            : "border-success bg-success-soft"
        )}
      >
        <span className="flex flex-col gap-1">
          <span
            className={cn(
              "text-lg font-semibold",
              hasDR ? "text-danger" : "text-success"
            )}
          >
            {hasDR ? t("drFound") : t("drNotFound")}
          </span>
          {drFinding && (
            <span className="text-[13px] text-muted-foreground">
              {t("probability", {
                value: format.percent(drFinding.probability),
              })}{" "}
              · {t("threshold", { value: format.percent(drFinding.threshold) })}
            </span>
          )}
        </span>
        <span className="text-end">
          <span className="block text-[26px] leading-none font-semibold">
            {format.percent(confidence)}
          </span>
        </span>
      </div>
      <ul className="flex flex-col gap-3">
        {analysis.stage1.findings.map((finding) => (
          <li key={finding.code} className="flex flex-col gap-1.5">
            <span className="flex items-center justify-between gap-3 text-sm">
              <span
                className={cn(
                  "font-medium",
                  finding.detected && "font-semibold"
                )}
                dir="auto"
              >
                {finding.name}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground tabular-nums">
                  {format.percent(finding.probability)}
                </span>
                <StatusChip tone={finding.detected ? "danger" : "neutral"}>
                  {finding.detected ? t("detected") : t("notDetected")}
                </StatusChip>
              </span>
            </span>
            <span className="relative block h-1.5 bg-muted" aria-hidden="true">
              <span
                className={cn(
                  "absolute inset-y-0 start-0",
                  finding.detected ? "bg-danger" : "bg-brand"
                )}
                style={{
                  width: `${Math.min(100, finding.probability * 100)}%`,
                }}
              />
              <span
                className="absolute -inset-y-1 w-0.5 bg-foreground"
                style={{
                  insetInlineStart: `${Math.min(100, finding.threshold * 100)}%`,
                }}
              />
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-subtle">{t("thresholdHint")}</p>
    </Panel>
  )
}

function HistoryPanel({ analysis }: { analysis: Analysis }) {
  const t = useTranslations("analyses.review")
  const format = useFormat()
  if (!analysis.history?.length) return null
  return (
    <Panel title={t("history")}>
      <ol className="flex flex-col gap-3">
        {[...analysis.history].reverse().map((entry, index) => (
          <li
            key={index}
            className="flex items-start justify-between gap-4 text-sm"
          >
            <span className="flex items-start gap-2.5">
              <span
                className="mt-1.5 size-2 shrink-0 rounded-full bg-brand"
                aria-hidden="true"
              />
              <span>{entry.message || t(`historyEvent.${entry.status}`)}</span>
            </span>
            <span className="shrink-0 text-xs text-subtle">
              {format.dateTime(entry.at)}
            </span>
          </li>
        ))}
      </ol>
    </Panel>
  )
}
