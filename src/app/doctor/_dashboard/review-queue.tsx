"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState, type ReactNode } from "react"

import { StatusChip } from "@/components/common/status-chip"
import { Skeleton } from "@/components/ui/skeleton"
import { useAnalysisLabels, useFormat } from "@/lib/i18n/use-labels"
import { cn } from "@/lib/utils"
import {
  useListAnalysesQuery,
  type AnalysisListParams,
} from "@/services/analysis.service"
import type { Analysis } from "@/types/api"

/** Review-queue filter buttons → analysis list filters (also used by the summary counters). */
export const QUEUE_FILTERS = {
  pending: {
    label: "filterPending",
    params: { reviewed: false, status: "completed" },
  },
  dr: { label: "filterDr", params: { hasDR: true, reviewed: false } },
  failed: { label: "filterFailed", params: { status: "failed" } },
} as const satisfies Record<
  string,
  { label: string; params: AnalysisListParams }
>

type QueueFilter = keyof typeof QUEUE_FILTERS

const COLUMNS = 6

/** The 8 most recent analyses for the chosen filter, refreshed every 30 s. */
export function ReviewQueue({ locked }: { locked: boolean }) {
  const t = useTranslations("dashboard")
  const [filter, setFilter] = useState<QueueFilter>("pending")
  const { data: queue, isFetching } = useListAnalysesQuery(
    { ...QUEUE_FILTERS[filter].params, size: 8 },
    { skip: locked, pollingInterval: 30_000 }
  )

  return (
    <section
      aria-labelledby="queue-title"
      className="min-w-0 flex-[999_1_560px] overflow-hidden border border-border bg-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-[18px]">
        <h2 id="queue-title" className="text-lg font-semibold">
          {t("queue")}
        </h2>
        <div
          className="inline-flex gap-1.5 text-[13px]"
          role="group"
          aria-label={t("filterQueue")}
        >
          {(Object.keys(QUEUE_FILTERS) as QueueFilter[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={cn(
                "min-h-[34px] px-3",
                filter === key
                  ? "bg-foreground font-semibold text-background"
                  : "border border-border font-medium text-muted-foreground"
              )}
            >
              {t(QUEUE_FILTERS[key].label)}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="text-start text-xs tracking-[0.04em] text-subtle uppercase">
              <th scope="col" className="px-5 py-3 font-semibold">
                {t("patient")}
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                {t("eye")}
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                {t("stage1")}
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                {t("status")}
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                {t("uploaded")}
              </th>
              <th scope="col" className="px-5 py-3">
                <span className="sr-only">{t("action")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isFetching && !queue
              ? Array.from({ length: 4 }, (_, index) => (
                  <tr key={index} className="border-t border-border">
                    <td colSpan={COLUMNS} className="px-5 py-3.5">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              : queue?.docs.map((analysis) => (
                  <QueueRow key={analysis._id} analysis={analysis} />
                ))}
            {queue && queue.docs.length === 0 && (
              <MessageRow>{t("emptyQueue")}</MessageRow>
            )}
            {locked && <MessageRow>{t("locked")}</MessageRow>}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function QueueRow({ analysis }: { analysis: Analysis }) {
  const t = useTranslations("dashboard")
  const format = useFormat()
  const labels = useAnalysisLabels()
  const stage1 = labels.stage1(analysis)
  // Show the review state once reviewed, otherwise the processing status.
  const chip = labels.review(analysis) ?? labels.status(analysis)
  const action =
    analysis.status === "failed"
      ? t("open")
      : analysis.reviewedAt
        ? t("view")
        : t("review")

  return (
    <tr className="border-t border-border">
      <td className="px-5 py-3.5">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">
            {analysis.patient?.name ?? t("unassigned")}
          </span>
          <span className="text-xs text-subtle">
            {analysis.image?.originalName ?? analysis._id.slice(-6)}
          </span>
        </div>
      </td>
      <td className="px-3 py-3.5 text-muted-foreground">
        {labels.eyeShort(analysis.image?.eye)}
      </td>
      <td className="px-3 py-3.5">
        <div className="flex flex-col gap-0.5">
          <span
            className={cn(
              "font-semibold",
              stage1.tone === "warning" && "text-warning",
              stage1.tone === "danger" && "text-danger",
              stage1.tone === "success" && "text-success"
            )}
          >
            {stage1.label}
          </span>
          <span className="text-xs text-subtle">{stage1.detail}</span>
        </div>
      </td>
      <td className="px-3 py-3.5">
        <StatusChip tone={chip.tone}>{chip.label}</StatusChip>
      </td>
      <td className="px-3 py-3.5 text-muted-foreground">
        {format.relative(analysis.createdAt)}
      </td>
      <td className="px-5 py-3.5 text-end">
        <Link
          href={`/doctor/analyses/${analysis._id}`}
          className="inline-flex min-h-9 items-center border border-border px-3.5 text-[13px] font-semibold hover:bg-muted"
        >
          {action}
        </Link>
      </td>
    </tr>
  )
}

/** Full-width row for empty/locked messages. */
function MessageRow({ children }: { children: ReactNode }) {
  return (
    <tr className="border-t border-border">
      <td
        colSpan={COLUMNS}
        className="px-5 py-10 text-center text-muted-foreground"
      >
        {children}
      </td>
    </tr>
  )
}
