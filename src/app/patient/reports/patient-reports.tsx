"use client"

import { DownloadIcon, FileTextIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { PageHeader } from "@/components/page/page-header"
import { Pagination } from "@/components/page/pagination"
import { EmptyState, ErrorState, ListSkeleton } from "@/components/page/states"
import { StatusChip } from "@/components/status-chip"
import { Button } from "@/components/ui/button"
import { useReportDownload } from "@/hooks/use-report-download"
import { useFormat } from "@/lib/i18n/use-labels"
import { useListReportsQuery } from "@/service/report.service"

const SIZE = 10

export function PatientReports() {
  const t = useTranslations("patient.reports")
  const tr = useTranslations("reports")
  const tc = useTranslations("common")
  const format = useFormat()
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useListReportsQuery({
    page,
    size: SIZE,
  })
  const { download, pendingId } = useReportDownload()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("lead")} />
      <div className="flex max-w-[880px] flex-col gap-4">
        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : !data || data.docs.length === 0 ? (
          <EmptyState
            icon={FileTextIcon}
            title={t("empty")}
            description={t("emptyHint")}
          />
        ) : (
          <ul className="flex flex-col border border-b-0 border-border">
            {data.docs.map((report) => (
              <li
                key={report._id}
                className="flex items-center gap-2 border-b border-border bg-card pe-2"
              >
                <Link
                  href={`/patient/reports/${report._id}`}
                  className="flex min-w-0 flex-1 items-center gap-4 px-4 py-4 hover:bg-muted"
                >
                  <span className="inline-flex size-10 shrink-0 items-center justify-center bg-brand-soft text-brand-strong">
                    <FileTextIcon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">
                        {report.title}
                      </span>
                      {!report.viewedAt && (
                        <StatusChip tone="info">{t("new")}</StatusChip>
                      )}
                    </span>
                    <span className="truncate text-[13px] text-muted-foreground">
                      {t("from", {
                        name: tc("doctorName", {
                          name: report.doctor?.name ?? "",
                        }),
                      })}{" "}
                      ·{" "}
                      {t("sent", {
                        date: format.date(report.sentAt ?? report.createdAt),
                      })}
                    </span>
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={tr("downloadLabel", { title: report.title })}
                  disabled={!report.hasPdf || pendingId === report._id}
                  onClick={() => void download(report)}
                  className="size-10 rounded-none"
                >
                  <DownloadIcon className="size-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {data && data.pages > 1 && (
          <Pagination
            page={page}
            size={SIZE}
            total={data.count}
            pages={data.pages}
            onChange={setPage}
          />
        )}
      </div>
    </div>
  )
}
