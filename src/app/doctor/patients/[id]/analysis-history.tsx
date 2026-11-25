"use client"

import { ScanEyeIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { StatusChip } from "@/components/common/status-chip"
import { EmptyState, ListSkeleton } from "@/components/page/states"
import { useAnalysisLabels, useFormat } from "@/lib/i18n/use-labels"
import type { Analysis } from "@/types/api"

/** "History" tab: the patient's analyses, newest first. `undefined` = loading. */
export function AnalysisHistory({ analyses }: { analyses?: Analysis[] }) {
  const t = useTranslations("patients")
  const tc = useTranslations("common")
  const format = useFormat()
  const labels = useAnalysisLabels()

  if (!analyses) return <ListSkeleton />
  if (analyses.length === 0)
    return (
      <EmptyState
        icon={ScanEyeIcon}
        title={t("detail.noAnalyses")}
        description={t("detail.noAnalysesHint")}
      />
    )

  return (
    <ol className="flex flex-col border border-b-0 border-border">
      {analyses.map((analysis) => {
        const stage1 = labels.stage1(analysis)
        const review = labels.review(analysis)
        return (
          <li
            key={analysis._id}
            className="flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3.5"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-sm font-semibold">
                {format.date(analysis.image?.capturedAt ?? analysis.createdAt)}{" "}
                · {labels.eye(analysis.image?.eye)}
              </span>
              <span className="text-xs text-subtle">
                {[stage1.label, stage1.detail].filter(Boolean).join(" · ")}
              </span>
            </span>
            {review && (
              <StatusChip tone={review.tone}>{review.label}</StatusChip>
            )}
            <Link
              href={`/doctor/analyses/${analysis._id}`}
              className="text-[13px] font-semibold text-brand hover:text-brand-strong"
            >
              {tc("open")}
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
