"use client"

import { ActivityIcon, CpuIcon, RefreshCwIcon, ScanEyeIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { StatusChip } from "@/components/status-chip"
import { Skeleton } from "@/components/ui/skeleton"
import { useAnalysisLabels, useFormat } from "@/lib/i18n/use-labels"
import { cn } from "@/lib/utils"
import type { AiHealth, FindingCode } from "@/types/api"
import type { Tone } from "@/util/format"

/** The subset of core's /model-info the server forwards in `AiHealth.info`. */
interface ModelInfo {
  ensemble_seeds?: number[]
  input_size?: number
  device?: string
  classes?: { code: FindingCode; name: string; threshold: number | null }[]
}

const asModelInfo = (info: AiHealth["info"]): ModelInfo =>
  info && typeof info === "object" ? (info as ModelInfo) : {}

export function AiServicePanel({
  health,
  loading,
  checkedAt,
  onRefresh,
  refreshing,
  processing,
  pending,
}: {
  health: AiHealth | undefined
  loading: boolean
  checkedAt: number | undefined
  onRefresh: () => void
  refreshing: boolean
  processing: number | undefined
  pending: number | undefined
}) {
  const t = useTranslations("analyses.ai")
  const tc = useTranslations("common")
  const format = useFormat()
  const labels = useAnalysisLabels()

  if (loading && !health) return <Skeleton className="h-[148px] rounded-none" />

  const state: { label: string; tone: Tone; dot: string; notice?: string } =
    !health || health.mode === "disabled"
      ? {
          label: t("disabled"),
          tone: "neutral",
          dot: "bg-subtle",
          notice: t("disabledNotice"),
        }
      : !health.available
        ? {
            label: t("offline"),
            tone: "danger",
            dot: "bg-danger",
            notice: health.error ?? t("offlineNotice"),
          }
        : health.mode === "mock"
          ? {
              label: t("mock"),
              tone: "warning",
              dot: "bg-warning",
              notice: t("mockNotice"),
            }
          : { label: t("online"), tone: "success", dot: "bg-success" }

  const info = asModelInfo(health?.info)
  const busy = (processing ?? 0) + (pending ?? 0) > 0

  return (
    <section
      aria-labelledby="ai-service-title"
      className="flex flex-col border border-border bg-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <span className="flex items-center gap-3">
          <span className="relative flex size-2.5" aria-hidden="true">
            {state.tone === "success" && (
              <span
                className={cn(
                  "absolute inline-flex size-full animate-ping opacity-60 motion-reduce:hidden",
                  state.dot
                )}
              />
            )}
            <span className={cn("relative inline-flex size-2.5", state.dot)} />
          </span>
          <h2 id="ai-service-title" className="text-[15px] font-semibold">
            {t("title")}
          </h2>
          <StatusChip tone={state.tone}>{state.label}</StatusChip>
        </span>
        <span className="flex items-center gap-3 text-xs text-subtle">
          {checkedAt && (
            <span>
              {t("checked", { time: format.relative(new Date(checkedAt)) })}
            </span>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex min-h-8 items-center gap-1.5 border border-border px-2.5 font-semibold text-foreground hover:bg-muted disabled:opacity-60"
          >
            <RefreshCwIcon
              className={cn("size-3.5", refreshing && "animate-spin")}
              aria-hidden="true"
            />
            {t("refresh")}
          </button>
        </span>
      </div>

      {state.notice && (
        <p
          role={state.tone === "danger" ? "alert" : "status"}
          className={cn(
            "border-s-[3px] border-b border-border px-5 py-2.5 text-sm",
            state.tone === "danger"
              ? "border-s-danger bg-danger-soft"
              : state.tone === "warning"
                ? "border-s-warning bg-warning-soft"
                : "border-s-border bg-surface"
          )}
        >
          {state.notice}
        </p>
      )}

      <dl className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
        <Fact icon={ScanEyeIcon} label={t("model")}>
          {health?.modelVersion ? (
            <span dir="ltr">{health.modelVersion}</span>
          ) : (
            tc("none")
          )}
        </Fact>
        <Fact icon={CpuIcon} label={t("ensemble")}>
          {info.ensemble_seeds && info.input_size ? (
            <span dir="ltr">
              {t("ensembleValue", {
                count: info.ensemble_seeds.length,
                size: info.input_size,
                device: (info.device ?? "?").toUpperCase(),
              })}
            </span>
          ) : (
            tc("none")
          )}
        </Fact>
        <Fact icon={ActivityIcon} label={t("queue")}>
          <span className="flex items-center gap-2">
            {busy
              ? t("queueValue", {
                  processing: processing ?? 0,
                  pending: pending ?? 0,
                })
              : t("queueIdle")}
            {busy && (
              <span className="inline-flex items-center gap-1 text-xs font-normal text-brand-strong">
                <span
                  className="size-1.5 animate-pulse bg-brand-strong"
                  aria-hidden="true"
                />
                {t("live")}
              </span>
            )}
          </span>
        </Fact>
      </dl>

      {info.classes && info.classes.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border px-5 py-3">
          <span className="text-xs font-semibold text-subtle">
            {t("thresholds")}
          </span>
          <ul className="flex flex-wrap gap-1.5">
            {info.classes.map(({ code, threshold }) => (
              <li
                key={code}
                className="inline-flex min-h-6 items-center gap-1.5 bg-muted px-2 text-xs"
              >
                <span className="font-semibold">{labels.finding(code)}</span>
                {threshold !== null && (
                  <span className="text-muted-foreground tabular-nums">
                    ≥ {format.percent(threshold)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof ScanEyeIcon
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden="true" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <dt className="text-xs text-subtle">{label}</dt>
        <dd className="truncate text-sm font-semibold">{children}</dd>
      </div>
    </div>
  )
}
