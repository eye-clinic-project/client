"use client"

/** Read-only view of a sent report (content, recommendations, doctor) with PDF download. */

import {
  ArrowLeftIcon,
  CalendarPlusIcon,
  DownloadIcon,
  MessageSquareIcon,
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { PdfPreview } from "@/components/common/pdf-preview"
import { PageHeader } from "@/components/page/page-header"
import { DetailList, Panel } from "@/components/page/panel"
import { ErrorState } from "@/components/page/states"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useReportDownload } from "@/hooks/use-report-download"
import { formatBytes } from "@/lib/format"
import { useFormat } from "@/lib/i18n/use-labels"
import { useGetReportQuery } from "@/services/report.service"

export function PatientReport({ id }: { id: string }) {
  const t = useTranslations("patient.reports")
  const tc = useTranslations("common")
  const format = useFormat()
  const { data: report, isLoading, isError, refetch } = useGetReportQuery(id)
  const { download, pendingId } = useReportDownload()

  if (isLoading) return <Skeleton className="h-96 w-full rounded-none" />
  if (isError || !report) return <ErrorState onRetry={refetch} />

  const doctorName = tc("doctorName", { name: report.doctor?.name ?? "" })

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/patient/reports"
        className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
        {t("back")}
      </Link>
      <PageHeader
        eyebrow={t("sent", {
          date: format.date(report.sentAt ?? report.createdAt),
        })}
        title={report.title}
        description={t("from", { name: doctorName })}
        actions={
          <Button
            disabled={!report.hasPdf || pendingId === report._id}
            onClick={() => void download(report)}
            className="h-10 gap-2 rounded-none px-4"
          >
            <DownloadIcon className="size-4" aria-hidden="true" />
            {tc("downloadPdf")}
          </Button>
        }
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel title={t("summary")}>
            <p
              className="text-sm leading-relaxed whitespace-pre-line"
              dir="auto"
            >
              {report.content?.trim() || t("noSummary")}
            </p>
          </Panel>
          {report.recommendations?.trim() && (
            <Panel title={t("recommendations")}>
              <p
                className="text-sm leading-relaxed whitespace-pre-line"
                dir="auto"
              >
                {report.recommendations}
              </p>
            </Panel>
          )}
          <Panel title={t("pdf")} bodyClassName="p-0">
            <PdfPreview
              path={
                report.hasPdf
                  ? `/report/${report._id}/download?v=${encodeURIComponent(report.updatedAt)}`
                  : null
              }
              title={report.title}
              emptyText={t("pdfEmpty")}
              errorText={t("pdfError")}
            />
          </Panel>
          <p className="border-s-[3px] border-border bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            {tc("disclaimer")}
          </p>
        </div>
        <aside className="flex flex-col gap-4">
          <Panel title={t("details")}>
            <DetailList
              items={[
                { label: t("doctor"), value: doctorName },
                {
                  label: t("date"),
                  value: format.dateTime(report.sentAt ?? report.createdAt),
                },
                ...(report.pdfSize
                  ? [
                      {
                        label: t("size"),
                        value: (
                          <span dir="ltr">{formatBytes(report.pdfSize)}</span>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </Panel>
          <Panel title={t("ask")} bodyClassName="gap-3">
            <p className="text-sm text-muted-foreground">{t("askBody")}</p>
            {report.doctor && (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/patient/messages?doctor=${report.doctor._id}`}
                  className="inline-flex min-h-10 items-center gap-2 border border-border px-4 text-sm font-semibold hover:bg-muted"
                >
                  <MessageSquareIcon className="size-4" aria-hidden="true" />
                  {tc("message")}
                </Link>
                <Link
                  href={`/patient/book?doctor=${report.doctor._id}`}
                  className="inline-flex min-h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <CalendarPlusIcon className="size-4" aria-hidden="true" />
                  {tc("bookVisit")}
                </Link>
              </div>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  )
}
