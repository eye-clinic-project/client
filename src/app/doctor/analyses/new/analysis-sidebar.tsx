"use client"

import { InfoIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { StatusChip } from "@/components/common/status-chip"
import { Panel } from "@/components/page/panel"
import { useAnalysisLabels } from "@/lib/i18n/use-labels"
import {
  useGetAiHealthQuery,
  useListAnalysesQuery,
} from "@/services/analysis.service"

/** AI availability and queue counts, refreshed periodically. */
export function AnalysisSidebar() {
  const t = useTranslations("analyses.create")
  const labels = useAnalysisLabels()
  const { data: health } = useGetAiHealthQuery(undefined, {
    pollingInterval: 60_000,
  })
  const { data: pending } = useListAnalysesQuery(
    { status: "pending", size: 5 },
    { pollingInterval: 15_000 }
  )
  const { data: processing } = useListAnalysesQuery(
    { status: "processing", size: 5 },
    { pollingInterval: 15_000 }
  )
  const queue = [
    ...new Map(
      [...(processing?.docs ?? []), ...(pending?.docs ?? [])].map(
        (analysis) => [analysis._id, analysis] as const
      )
    ).values(),
  ]

  return (
    <div className="flex flex-col gap-4">
      <Panel
        title={t("aiService")}
        action={
          health && (
            <StatusChip
              tone={
                health.available
                  ? health.mode === "mock"
                    ? "warning"
                    : "success"
                  : "danger"
              }
            >
              {health.available
                ? health.mode === "mock"
                  ? t("mock")
                  : t("online")
                : t("offline")}
            </StatusChip>
          )
        }
      >
        <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          {health?.modelVersion && (
            <li dir="auto">{t("model", { version: health.modelVersion })}</li>
          )}
          {health?.error && <li className="text-danger">{health.error}</li>}
          <li>{t("stage2Missing")}</li>
        </ul>
      </Panel>
      <Panel
        title={t("queue")}
        action={
          <Link
            href="/doctor/analyses"
            className="text-[13px] font-semibold text-brand hover:text-brand-strong"
          >
            {t("allAnalyses")}
          </Link>
        }
        bodyClassName="p-0"
      >
        {queue.length === 0 ? (
          <p className="px-5 py-4 text-sm text-subtle">{t("queueEmpty")}</p>
        ) : (
          <ul className="flex flex-col">
            {queue.map((analysis) => {
              const status = labels.status(analysis)
              return (
                <li
                  key={analysis._id}
                  className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 last:border-b-0"
                >
                  <span className="min-w-0 text-sm">
                    <span className="font-semibold">
                      {analysis.patient?.name}
                    </span>
                    <span className="text-subtle">
                      {" "}
                      · {labels.eye(analysis.image?.eye)}
                    </span>
                  </span>
                  <StatusChip tone={status.tone}>{status.label}</StatusChip>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
      <div
        role="status"
        className="flex gap-3 border-s-[3px] border-brand bg-brand-soft px-4 py-3.5 text-sm"
      >
        <InfoIcon
          className="mt-0.5 size-4 shrink-0 text-brand-strong"
          aria-hidden="true"
        />
        <span className="flex flex-col gap-1">
          <span className="font-semibold text-brand-strong">
            {t("nextTitle")}
          </span>
          <span className="leading-relaxed text-foreground">
            {t("nextBody")}
          </span>
        </span>
      </div>
    </div>
  )
}
