"use client"

/**
 * One analysis in detail:
 * - image + Grad-CAM heatmap (protected files)
 * - stage-1 findings and stage-2 DR grade
 * - status history, retry/delete actions
 * - the doctor's review form and the related report
 */

import { ExternalLinkIcon, RotateCcwIcon, Trash2Icon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { StatusChip } from "@/components/common/status-chip"
import { UserAvatar } from "@/components/common/user-avatar"
import { ConfirmDialog } from "@/components/page/confirm-dialog"
import { Panel } from "@/components/page/panel"
import { ErrorState } from "@/components/page/states"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { usePatientByUser } from "@/hooks/use-patient-by-user"
import { openProtectedFile } from "@/lib/api/protected-file"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { ageFrom, useAnalysisLabels } from "@/lib/i18n/use-labels"
import {
  useDeleteAnalysisMutation,
  useGetAnalysisQuery,
  useRetryAnalysisMutation,
} from "@/services/analysis.service"
import { useListReportsQuery } from "@/services/report.service"

import { HistoryPanel } from "./history-panel"
import { ImagePanel } from "./image-panel"
import { ReviewForm } from "./review-form"
import { Stage1Panel } from "./stage1-panel"

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
  // Same query, second subscription with polling: refresh every 5 s only while
  // the analysis is still queued/processing. Both share one cache entry.
  useGetAnalysisQuery(id, { skip: !running, pollingInterval: 5_000 })
  // The analysis only carries the user; find their patient record to list their reports.
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
