"use client"

import { DownloadIcon, FileTextIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { PageHeader } from "@/components/page/page-header"
import { Pagination } from "@/components/page/pagination"
import { EmptyState, ErrorState, ListSkeleton } from "@/components/page/states"
import { TabBar } from "@/components/page/tab-bar"
import { StatusChip } from "@/components/status-chip"
import { UserAvatar } from "@/components/user-avatar"
import { useReportDownload } from "@/hooks/use-report-download"
import { useFormat } from "@/lib/i18n/use-labels"
import { useListReportsQuery } from "@/service/report.service"
import type { ReportStatus } from "@/types/api"

const PAGE_SIZE = 15

export function ReportsView() {
  const t = useTranslations("reports")
  const tc = useTranslations("common")
  const format = useFormat()
  const [tab, setTab] = useState<"all" | ReportStatus>("all")
  const [page, setPage] = useState(1)
  const status = tab === "all" ? undefined : tab
  const { data, isLoading, isError, refetch, isFetching } = useListReportsQuery(
    { status, page, size: PAGE_SIZE }
  )
  const counts = {
    all: useListReportsQuery({ size: 1 }).data?.count,
    draft: useListReportsQuery({ status: "draft", size: 1 }).data?.count,
    sent: useListReportsQuery({ status: "sent", size: 1 }).data?.count,
  }
  const { download, pendingId } = useReportDownload()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("lead")} />
      <TabBar
        label={t("views")}
        value={tab}
        onChange={(value) => {
          setTab(value)
          setPage(1)
        }}
        items={[
          { value: "all", label: t("all"), count: counts.all },
          { value: "draft", label: t("drafts"), count: counts.draft },
          { value: "sent", label: t("sent"), count: counts.sent },
        ]}
      />
      {isLoading ? (
        <ListSkeleton rows={6} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : !data || data.docs.length === 0 ? (
        <EmptyState
          icon={FileTextIcon}
          title={t("empty")}
          description={t("emptyHint")}
        />
      ) : (
        <>
          <div
            className="overflow-x-auto border border-border"
            aria-busy={isFetching}
          >
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-surface text-xs font-semibold text-subtle">
                <tr>
                  {(
                    ["patient", "title", "status", "opened", "created"] as const
                  ).map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="px-4 py-3 text-start"
                    >
                      {t(`columns.${column}`)}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3 text-end">
                    {t("columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.docs.map((report) => (
                  <tr
                    key={report._id}
                    className="border-t border-border hover:bg-surface"
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-3">
                        <UserAvatar
                          name={report.patient?.name ?? "?"}
                          src={report.patient?.avatarUrl ?? null}
                        />
                        <span className="font-semibold">
                          {report.patient?.name}
                        </span>
                      </span>
                    </td>
                    <td className="max-w-72 truncate px-4 py-3 text-muted-foreground">
                      {report.title}
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip
                        tone={report.status === "sent" ? "success" : "warning"}
                      >
                        {tc(`reportStatus.${report.status}`)}
                      </StatusChip>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {report.status !== "sent"
                        ? tc("none")
                        : report.viewedAt
                          ? t("viewed", {
                              date: format.dateTime(report.viewedAt),
                            })
                          : t("notViewed")}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format.shortDate(report.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {report.hasPdf && (
                          <button
                            type="button"
                            aria-label={t("downloadLabel", {
                              title: report.title,
                            })}
                            disabled={pendingId === report._id}
                            onClick={() => void download(report)}
                            className="inline-flex size-9 items-center justify-center border border-border hover:bg-muted disabled:opacity-50"
                          >
                            <DownloadIcon
                              className="size-4"
                              aria-hidden="true"
                            />
                          </button>
                        )}
                        <Link
                          href={`/doctor/reports/${report._id}`}
                          className="inline-flex min-h-9 items-center border border-border px-3 text-[13px] font-semibold hover:bg-muted"
                        >
                          {tc("open")}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.currentPage}
            size={data.size}
            total={data.count}
            pages={data.pages}
            onChange={setPage}
          />
        </>
      )}
    </div>
  )
}
