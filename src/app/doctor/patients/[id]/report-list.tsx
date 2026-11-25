"use client"

import { FileTextIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { StatusChip } from "@/components/common/status-chip"
import { EmptyState, ListSkeleton } from "@/components/page/states"
import { useReportDownload } from "@/hooks/use-report-download"
import { useFormat } from "@/lib/i18n/use-labels"
import type { Report } from "@/types/api"

/** "Reports" tab: the patient's reports with status, PDF download and open. `undefined` = loading. */
export function ReportList({ reports }: { reports?: Report[] }) {
  const t = useTranslations("patients")
  const tc = useTranslations("common")
  const format = useFormat()
  const { download, pendingId } = useReportDownload()

  if (!reports) return <ListSkeleton />
  if (reports.length === 0)
    return <EmptyState icon={FileTextIcon} title={t("detail.noReports")} />

  return (
    <ul className="flex flex-col border border-b-0 border-border">
      {reports.map((report) => (
        <li
          key={report._id}
          className="flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3.5"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-sm font-semibold">
              {report.title}
            </span>
            <span className="text-xs text-subtle">
              {format.date(report.createdAt)}
            </span>
          </span>
          <StatusChip tone={report.status === "sent" ? "success" : "warning"}>
            {tc(`reportStatus.${report.status}`)}
          </StatusChip>
          {report.hasPdf && (
            <button
              type="button"
              disabled={pendingId === report._id}
              onClick={() => void download(report)}
              className="text-[13px] font-semibold text-brand hover:text-brand-strong disabled:opacity-50"
            >
              {tc("download")}
            </button>
          )}
          <Link
            href={`/doctor/reports/${report._id}`}
            className="text-[13px] font-semibold text-brand hover:text-brand-strong"
          >
            {tc("open")}
          </Link>
        </li>
      ))}
    </ul>
  )
}
