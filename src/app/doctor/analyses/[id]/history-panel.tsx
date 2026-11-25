"use client"

import { useTranslations } from "next-intl"

import { Panel } from "@/components/page/panel"
import { useFormat } from "@/lib/i18n/use-labels"
import type { Analysis } from "@/types/api"

/** Timeline of status changes (queued, processing, retries, errors…). */
export function HistoryPanel({ analysis }: { analysis: Analysis }) {
  const t = useTranslations("analyses.review")
  const format = useFormat()
  if (!analysis.history?.length) return null
  return (
    <Panel title={t("history")}>
      <ol className="flex flex-col gap-3">
        {[...analysis.history].reverse().map((entry, index) => (
          <li
            key={index}
            className="flex items-start justify-between gap-4 text-sm"
          >
            <span className="flex items-start gap-2.5">
              <span
                className="mt-1.5 size-2 shrink-0 rounded-full bg-brand"
                aria-hidden="true"
              />
              <span>{entry.message || t(`historyEvent.${entry.status}`)}</span>
            </span>
            <span className="shrink-0 text-xs text-subtle">
              {format.dateTime(entry.at)}
            </span>
          </li>
        ))}
      </ol>
    </Panel>
  )
}
