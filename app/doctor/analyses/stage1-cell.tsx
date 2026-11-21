"use client"

import { FlameIcon, LoaderCircleIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { StatusChip } from "@/components/status-chip"
import { useAnalysisLabels, useFormat } from "@/lib/i18n/use-labels"
import { cn } from "@/lib/utils"
import type { Analysis, AnalysisFinding, FindingCode } from "@/types/api"

const TONE_TEXT = {
  danger: "text-danger",
  success: "text-success",
  warning: "text-warning",
  info: "text-brand-strong",
  neutral: "text-foreground",
} as const

/** Stage-1 numbers, falling back to the D finding for analyses saved before the server stored them. */
export function stage1Numbers(analysis: Analysis) {
  const dr = analysis.stage1.findings.find((finding) => finding.code === "D")
  return {
    probability: analysis.stage1.drProbability ?? dr?.probability ?? null,
    threshold: analysis.stage1.threshold ?? dr?.threshold ?? null,
  }
}

/** Findings worth listing next to the DR verdict: the shown codes minus D and Normal. */
function extraFindings(analysis: Analysis): AnalysisFinding[] {
  const byCode = new Map(analysis.stage1.findings.map((f) => [f.code, f]))
  const codes: FindingCode[] =
    analysis.stage1.shown ??
    analysis.stage1.findings.filter((f) => f.detected).map((f) => f.code)
  return codes
    .filter((code) => code !== "D" && code !== "N")
    .map((code) => byCode.get(code))
    .filter((finding): finding is AnalysisFinding => Boolean(finding))
    .slice(0, 3)
}

export function Stage1Cell({ analysis }: { analysis: Analysis }) {
  const t = useTranslations("analyses")
  const labels = useAnalysisLabels()
  const format = useFormat()
  const summary = labels.stage1(analysis)

  if (analysis.status === "pending" || analysis.status === "processing") {
    return (
      <span className="flex flex-col gap-0.5" role="status">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 font-semibold",
            TONE_TEXT[summary.tone]
          )}
        >
          {analysis.status === "processing" && (
            <LoaderCircleIcon
              className="size-3.5 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          )}
          {analysis.status === "processing" ? t("analysing") : summary.label}
        </span>
        <span className="text-xs text-subtle">{summary.detail}</span>
      </span>
    )
  }

  if (analysis.status === "failed") {
    return (
      <span className="flex max-w-[280px] flex-col gap-0.5">
        <span className="font-semibold text-danger">{summary.label}</span>
        <span className="line-clamp-2 text-xs text-subtle">
          {summary.detail}
          {analysis.attempts > 1 &&
            ` · ${t("attempts", { count: analysis.attempts })}`}
        </span>
      </span>
    )
  }

  const { probability, threshold } = stage1Numbers(analysis)
  const extras = extraFindings(analysis)
  const suspected = analysis.stage1.status === "SUSPECTED"
  const camClass = analysis.hasGradCam ? analysis.stage1.gradCamClass : null

  return (
    <span className="flex min-w-[220px] flex-col gap-1.5">
      <span className="flex flex-wrap items-center gap-2">
        <span className={cn("font-semibold", TONE_TEXT[summary.tone])}>
          {summary.label}
        </span>
        {analysis.isMock && <StatusChip tone="neutral">{t("mock")}</StatusChip>}
      </span>

      {probability !== null && (
        <span className="flex flex-col gap-1">
          <span
            role="meter"
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={probability}
            aria-label={t("meterLabel", {
              value: format.percent(probability),
              threshold: threshold !== null ? format.percent(threshold) : "–",
            })}
            className="relative h-1.5 w-full max-w-[200px] bg-muted"
          >
            <span
              className={cn(
                "absolute inset-y-0 start-0",
                analysis.stage1.hasDR ? "bg-danger" : "bg-success"
              )}
              style={{ width: `${Math.min(100, probability * 100)}%` }}
            />
            {threshold !== null && (
              <span
                aria-hidden="true"
                className="absolute -inset-y-1 w-0.5 bg-foreground"
                style={{ insetInlineStart: `${threshold * 100}%` }}
              />
            )}
          </span>
          <span className="text-xs text-subtle tabular-nums">
            {t("drProbability", { value: format.percent(probability) })}
            {threshold !== null &&
              ` · ${t("thresholdShort", { value: format.percent(threshold) })}`}
          </span>
        </span>
      )}

      {extras.length > 0 && (
        <span className="flex flex-wrap items-center gap-1">
          {suspected && (
            <span className="text-xs text-subtle">{t("suspected")}:</span>
          )}
          {extras.map((finding) => (
            <StatusChip
              key={finding.code}
              tone={finding.detected ? "warning" : "neutral"}
              className="min-h-5 px-1.5 text-[11px]"
            >
              {labels.finding(finding.code)}{" "}
              {format.percent(finding.probability)}
            </StatusChip>
          ))}
        </span>
      )}

      {camClass && (
        <span className="inline-flex items-center gap-1 text-xs text-subtle">
          <FlameIcon className="size-3" aria-hidden="true" />
          {t("gradCam", { finding: labels.finding(camClass) })}
        </span>
      )}
    </span>
  )
}
