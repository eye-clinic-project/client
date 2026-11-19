"use client"

import { PlusIcon, ScanEyeIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { FilterSelect } from "@/components/form/select-field"
import { PageHeader } from "@/components/page/page-header"
import { Pagination } from "@/components/page/pagination"
import { EmptyState, ErrorState, ListSkeleton } from "@/components/page/states"
import { TabBar } from "@/components/page/tab-bar"
import { StatusChip } from "@/components/status-chip"
import { UserAvatar } from "@/components/user-avatar"
import { useAnalysisLabels, useFormat } from "@/lib/i18n/use-labels"
import {
  useListAnalysesQuery,
  type AnalysisListParams,
} from "@/service/analysis.service"
import type { AnalysisStatus } from "@/types/api"

type Tab = "all" | "review" | "dr" | "failed"

const TAB_FILTER: Record<Tab, AnalysisListParams> = {
  all: {},
  review: { status: "completed", reviewed: false },
  dr: { status: "completed", hasDR: true },
  failed: { status: "failed" },
}

const PAGE_SIZE = 15

export function AnalysesView() {
  const t = useTranslations("analyses")
  const tc = useTranslations("common")
  const format = useFormat()
  const labels = useAnalysisLabels()
  const [tab, setTab] = useState<Tab>("all")
  const [status, setStatus] = useState<"" | AnalysisStatus>("")
  const [result, setResult] = useState<"" | "dr" | "none">("")
  const [page, setPage] = useState(1)

  const filters: AnalysisListParams = {
    ...(status ? { status } : {}),
    ...(result ? { hasDR: result === "dr", status: "completed" as const } : {}),
    ...TAB_FILTER[tab],
  }
  const { data, isLoading, isError, refetch, isFetching } =
    useListAnalysesQuery({ ...filters, page, size: PAGE_SIZE })
  const counts = {
    all: useListAnalysesQuery({ size: 1 }).data?.count,
    review: useListAnalysesQuery({ ...TAB_FILTER.review, size: 1 }).data?.count,
    dr: useListAnalysesQuery({ ...TAB_FILTER.dr, size: 1 }).data?.count,
    failed: useListAnalysesQuery({ ...TAB_FILTER.failed, size: 1 }).data?.count,
  }
  const filtered = tab !== "all" || status !== "" || result !== ""
  const reset = () => setPage(1)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("lead")}
        actions={
          <Link
            href="/doctor/analyses/new"
            className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <PlusIcon className="size-4" aria-hidden="true" />
            {t("new")}
          </Link>
        }
      />
      <TabBar
        label={t("views")}
        value={tab}
        onChange={(value) => {
          setTab(value)
          reset()
        }}
        items={[
          { value: "all", label: t("tabAll"), count: counts.all },
          { value: "review", label: t("tabReview"), count: counts.review },
          { value: "dr", label: t("tabDr"), count: counts.dr },
          { value: "failed", label: t("tabFailed"), count: counts.failed },
        ]}
      />
      {tab === "all" && (
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect
            id="analysis-status"
            label={t("status")}
            value={status}
            onChange={(value) => {
              setStatus(value as "" | AnalysisStatus)
              reset()
            }}
            options={[
              { value: "", label: tc("all") },
              ...(
                ["pending", "processing", "completed", "failed"] as const
              ).map((value) => ({
                value,
                label: tc(`analysisStatus.${value}`),
              })),
            ]}
          />
          <FilterSelect
            id="analysis-result"
            label={t("result")}
            value={result}
            onChange={(value) => {
              setResult(value as "" | "dr" | "none")
              reset()
            }}
            options={[
              { value: "", label: tc("all") },
              { value: "dr", label: t("resultDr") },
              { value: "none", label: t("resultNoDr") },
            ]}
          />
        </div>
      )}

      {isLoading ? (
        <ListSkeleton rows={8} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : !data || data.docs.length === 0 ? (
        <EmptyState
          icon={ScanEyeIcon}
          title={filtered ? t("emptyFiltered") : t("empty")}
          description={filtered ? undefined : t("emptyHint")}
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
                    [
                      "patient",
                      "eye",
                      "stage1",
                      "status",
                      "review",
                      "uploaded",
                    ] as const
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
                {data.docs.map((analysis) => {
                  const stage1 = labels.stage1(analysis)
                  const state = labels.status(analysis)
                  const review = labels.review(analysis)
                  return (
                    <tr
                      key={analysis._id}
                      className="border-t border-border hover:bg-surface"
                    >
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-3">
                          <UserAvatar
                            name={analysis.patient?.name ?? "?"}
                            src={analysis.patient?.avatarUrl ?? null}
                          />
                          <span className="font-semibold">
                            {analysis.patient?.name ?? t("unknownPatient")}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {labels.eyeShort(analysis.image?.eye)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex flex-col gap-0.5">
                          <span
                            className={
                              stage1.tone === "danger"
                                ? "font-semibold text-danger"
                                : stage1.tone === "success"
                                  ? "font-semibold text-success"
                                  : "font-semibold"
                            }
                          >
                            {stage1.label}
                          </span>
                          {stage1.detail && analysis.status === "completed" && (
                            <span className="text-xs text-subtle">
                              {stage1.detail}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip tone={state.tone}>{state.label}</StatusChip>
                      </td>
                      <td className="px-4 py-3">
                        {review ? (
                          <StatusChip tone={review.tone}>
                            {review.label}
                          </StatusChip>
                        ) : (
                          tc("none")
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {format.dateTime(analysis.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <Link
                          href={`/doctor/analyses/${analysis._id}`}
                          className={
                            review?.tone === "warning"
                              ? "inline-flex min-h-9 items-center bg-primary px-3 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90"
                              : "inline-flex min-h-9 items-center border border-border px-3 text-[13px] font-semibold hover:bg-muted"
                          }
                        >
                          {review?.tone === "warning"
                            ? t("reviewAction")
                            : t("open")}
                        </Link>
                      </td>
                    </tr>
                  )
                })}
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
