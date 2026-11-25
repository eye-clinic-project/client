"use client"

/**
 * Report editor: title, content and recommendations, with the review it is based on.
 * Actions: save, regenerate from the latest data, send to the patient, download PDF, delete.
 */

import { zodResolver } from "@hookform/resolvers/zod"
import {
  CheckCircle2Icon,
  CircleIcon,
  DownloadIcon,
  RefreshCwIcon,
  SendIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { PdfPreview } from "@/components/common/pdf-preview"
import { StatusChip } from "@/components/common/status-chip"
import { FormAlert } from "@/components/form/form-alert"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { TextareaField } from "@/components/form/textarea-field"
import { ConfirmDialog } from "@/components/page/confirm-dialog"
import { Panel } from "@/components/page/panel"
import { ErrorState } from "@/components/page/states"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useReportDownload } from "@/hooks/use-report-download"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { useFormat } from "@/lib/i18n/use-labels"
import { useGetReviewQuery } from "@/services/analysis.service"
import {
  useDeleteReportMutation,
  useGetReportQuery,
  useRegenerateReportMutation,
  useSendReportMutation,
  useUpdateReportMutation,
} from "@/services/report.service"
import type { Report } from "@/types/api"
import { reportSchema } from "@/validation/report.schema"

export function ReportEditor({ id }: { id: string }) {
  const t = useTranslations("reports.editor")
  const { data: report, isLoading, isError, refetch } = useGetReportQuery(id)
  if (isLoading) return <Skeleton className="h-96 w-full rounded-none" />
  if (isError || !report)
    return <ErrorState message={t("notFound")} onRetry={refetch} />
  // `key` resets the form state when another report is opened.
  return <ReportEditorBody key={report._id} report={report} />
}

function ReportEditorBody({ report }: { report: Report }) {
  const t = useTranslations("reports.editor")
  const tc = useTranslations("common")
  const router = useRouter()
  const format = useFormat()
  const errorText = useErrorText()
  const { download, pendingId } = useReportDownload()
  const { data: review } = useGetReviewQuery(report.analysis)
  const [update] = useUpdateReportMutation()
  const [regenerate, { isLoading: regenerating }] =
    useRegenerateReportMutation()
  const [send, { isLoading: sending }] = useSendReportMutation()
  const [remove, { isLoading: removing }] = useDeleteReportMutation()
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<"send" | "delete" | null>(null)
  const sent = report.status === "sent"
  const form = useForm({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: report.title,
      content: report.content ?? "",
      recommendations: report.recommendations ?? "",
    },
  })

  const onSubmit = form.handleSubmit(async (body) => {
    setError(null)
    try {
      await update({ id: report._id, ...body }).unwrap()
      await regenerate(report._id).unwrap()
      form.reset(form.getValues())
      toast.success(t("saved"))
    } catch (caught) {
      setError(errorText(caught))
    }
  })

  const checks = [
    { label: t("reqReview"), done: Boolean(review) },
    { label: t("reqNotes"), done: Boolean(review?.notes) },
    { label: t("reqPdf"), done: report.hasPdf },
  ]
  const ready = checks.every((check) => check.done) && !form.formState.isDirty

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em]">
              {t("heading")}
            </h1>
            <StatusChip tone={sent ? "success" : "warning"}>
              {tc(`reportStatus.${report.status}`)}
            </StatusChip>
          </div>
          <p className="text-sm text-subtle">
            {t("meta", {
              patient: report.patient?.name ?? "",
              date: format.date(report.createdAt),
            })}{" "}
            · {t("generated", { time: format.dateTime(report.updatedAt) })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!sent && (
            <Button
              variant="outline"
              disabled={regenerating}
              onClick={async () => {
                try {
                  await regenerate(report._id).unwrap()
                  toast.success(t("regenerated"))
                } catch (caught) {
                  toast.error(errorText(caught))
                }
              }}
              className="h-10 gap-2 rounded-none px-4"
            >
              <RefreshCwIcon className="size-4" aria-hidden="true" />
              {t("regenerate")}
            </Button>
          )}
          <Button
            variant="outline"
            disabled={!report.hasPdf || pendingId === report._id}
            onClick={() => void download(report)}
            className="h-10 gap-2 rounded-none px-4"
          >
            <DownloadIcon className="size-4" aria-hidden="true" />
            {tc("download")}
          </Button>
          {!sent && (
            <Button
              disabled={!ready}
              onClick={() => setDialog("send")}
              className="h-10 gap-2 rounded-none px-4"
            >
              <SendIcon
                className="size-4 rtl:-scale-x-100"
                aria-hidden="true"
              />
              {t("send")}
            </Button>
          )}
        </div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel id="report-content" title={t("content")} bodyClassName="gap-5">
          <ol
            aria-label={t("requirements")}
            className="flex flex-col gap-2 border border-border bg-surface p-3"
          >
            {checks.map((check) => (
              <li
                key={check.label}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex items-center gap-2">
                  {check.done ? (
                    <CheckCircle2Icon
                      className="size-4 text-success"
                      aria-hidden="true"
                    />
                  ) : (
                    <CircleIcon
                      className="size-4 text-subtle"
                      aria-hidden="true"
                    />
                  )}
                  {check.label}
                </span>
                <span
                  className={
                    check.done ? "text-xs text-success" : "text-xs text-subtle"
                  }
                >
                  {check.done ? t("reqDone") : t("reqMissing")}
                </span>
              </li>
            ))}
            <li>
              <Link
                href={`/doctor/analyses/${report.analysis}`}
                className="text-[13px] font-semibold text-brand hover:text-brand-strong"
              >
                {t("openReview")}
              </Link>
            </li>
          </ol>
          {error && <FormAlert>{error}</FormAlert>}
          {sent ? (
            <FormAlert tone="success">
              {t("sentNote", {
                date: format.dateTime(report.sentAt ?? report.updatedAt),
              })}
            </FormAlert>
          ) : (
            <form
              noValidate
              onSubmit={onSubmit}
              className="flex flex-col gap-5"
            >
              <TextField
                control={form.control}
                name="title"
                label={t("titleField")}
              />
              <TextareaField
                control={form.control}
                name="content"
                label={t("summary")}
                rows={5}
                description={t("summaryHint")}
              />
              <TextareaField
                control={form.control}
                name="recommendations"
                label={t("recommendations")}
                rows={3}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-5">
                <button
                  type="button"
                  onClick={() => setDialog("delete")}
                  className="text-sm font-semibold text-danger hover:underline"
                >
                  {t("deleteDraft")}
                </button>
                <SubmitButton
                  pending={form.formState.isSubmitting}
                  className="h-11 w-auto px-5 text-sm"
                >
                  {t("save")}
                </SubmitButton>
              </div>
              <p className="text-xs leading-relaxed text-subtle">
                {t("finalNote")}
              </p>
            </form>
          )}
        </Panel>
        <Panel title={t("preview")}>
          <PdfPreview
            path={
              report.hasPdf
                ? `/report/${report._id}/download?v=${encodeURIComponent(report.updatedAt)}`
                : null
            }
            title={t("preview")}
            emptyText={t("previewMissing")}
            errorText={t("previewFailed")}
          />
        </Panel>
      </div>

      <ConfirmDialog
        open={dialog === "send"}
        onOpenChange={(open) => setDialog(open ? "send" : null)}
        title={t("sendTitle", { name: report.patient?.name ?? "" })}
        description={t("sendBody")}
        confirmLabel={t("send")}
        pending={sending}
        onConfirm={async () => {
          try {
            await send(report._id).unwrap()
            setDialog(null)
            toast.success(t("sentToast"))
          } catch (caught) {
            toast.error(errorText(caught))
          }
        }}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(open) => setDialog(open ? "delete" : null)}
        title={t("deleteTitle")}
        description={t("deleteBody")}
        confirmLabel={t("deleteDraft")}
        destructive
        pending={removing}
        onConfirm={async () => {
          try {
            await remove(report._id).unwrap()
            toast.success(t("deleted"))
            router.replace("/doctor/reports")
          } catch (caught) {
            toast.error(errorText(caught))
          }
        }}
      />
    </div>
  )
}
