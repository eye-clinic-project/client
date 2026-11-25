"use client"

import { useTranslations } from "next-intl"

import { StatusChip } from "@/components/common/status-chip"
import { Panel } from "@/components/page/panel"
import { useFormat } from "@/lib/i18n/use-labels"
import { cn } from "@/lib/utils"
import type { Analysis } from "@/types/api"

/** All stage-1 findings with probability vs threshold. */
export function Stage1Panel({ analysis }: { analysis: Analysis }) {
  const t = useTranslations("analyses.review")
  const format = useFormat()

  if (analysis.status === "pending" || analysis.status === "processing") {
    return (
      <Panel title={t("stage1")}>
        <p role="status" className="text-sm text-muted-foreground">
          {t("inProgress")}
        </p>
      </Panel>
    )
  }
  if (analysis.status === "failed") {
    return (
      <Panel title={t("stage1")}>
        <div
          role="alert"
          className="flex flex-col gap-1 border-s-[3px] border-danger bg-danger-soft px-4 py-3"
        >
          <span className="font-semibold text-danger">{t("failed")}</span>
          {analysis.error && <span className="text-sm">{analysis.error}</span>}
        </div>
      </Panel>
    )
  }

  const confidence = analysis.stage1.confidence ?? 0
  const drFinding = analysis.stage1.findings.find(
    (finding) => finding.code === "D"
  )
  const hasDR = Boolean(analysis.stage1.hasDR)

  return (
    <Panel
      title={t("stage1")}
      action={<span className="text-xs text-subtle">{t("stage1Hint")}</span>}
      bodyClassName="gap-5"
    >
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-4 border-s-[3px] px-4 py-3.5",
          hasDR
            ? "border-danger bg-danger-soft"
            : "border-success bg-success-soft"
        )}
      >
        <span className="flex flex-col gap-1">
          <span
            className={cn(
              "text-lg font-semibold",
              hasDR ? "text-danger" : "text-success"
            )}
          >
            {hasDR ? t("drFound") : t("drNotFound")}
          </span>
          {drFinding && (
            <span className="text-[13px] text-muted-foreground">
              {t("probability", {
                value: format.percent(drFinding.probability),
              })}{" "}
              · {t("threshold", { value: format.percent(drFinding.threshold) })}
            </span>
          )}
        </span>
        <span className="text-end">
          <span className="block text-[26px] leading-none font-semibold">
            {format.percent(confidence)}
          </span>
        </span>
      </div>
      <ul className="flex flex-col gap-3">
        {analysis.stage1.findings.map((finding) => (
          <li key={finding.code} className="flex flex-col gap-1.5">
            <span className="flex items-center justify-between gap-3 text-sm">
              <span
                className={cn(
                  "font-medium",
                  finding.detected && "font-semibold"
                )}
                dir="auto"
              >
                {finding.name}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground tabular-nums">
                  {format.percent(finding.probability)}
                </span>
                <StatusChip tone={finding.detected ? "danger" : "neutral"}>
                  {finding.detected ? t("detected") : t("notDetected")}
                </StatusChip>
              </span>
            </span>
            <span className="relative block h-1.5 bg-muted" aria-hidden="true">
              <span
                className={cn(
                  "absolute inset-y-0 start-0",
                  finding.detected ? "bg-danger" : "bg-brand"
                )}
                style={{
                  width: `${Math.min(100, finding.probability * 100)}%`,
                }}
              />
              <span
                className="absolute -inset-y-1 w-0.5 bg-foreground"
                style={{
                  insetInlineStart: `${Math.min(100, finding.threshold * 100)}%`,
                }}
              />
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-subtle">{t("thresholdHint")}</p>
    </Panel>
  )
}
