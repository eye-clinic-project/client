"use client"

import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { useGetAiHealthQuery } from "@/services/analysis.service"

/** Online/offline strip for the AI service (model version, mock mode, last error). */
export function AiStatusBanner({ locked }: { locked: boolean }) {
  const t = useTranslations("dashboard")
  const { data: health, isError } = useGetAiHealthQuery(undefined, {
    skip: locked,
    pollingInterval: 60_000,
  })

  if (locked || (!health && !isError)) return null
  const online = Boolean(health?.available)

  return (
    <section
      aria-label={t("aiService")}
      className={cn(
        "flex flex-wrap items-center gap-x-6 gap-y-3 border px-5 py-3.5 text-sm",
        online
          ? "border-success/30 bg-success-soft text-success"
          : "border-danger/30 bg-danger-soft text-danger"
      )}
    >
      <span className="inline-flex items-center gap-2 font-semibold">
        <span
          className={cn(
            "size-2 rounded-full",
            online ? "bg-success" : "bg-danger"
          )}
        />
        {online ? t("aiOnline") : t("aiOffline")}
      </span>
      {health?.modelVersion && (
        <span dir="auto">{t("aiModel", { version: health.modelVersion })}</span>
      )}
      {health?.mode === "mock" && <span>{t("aiMock")}</span>}
      {health && !health.available && health.error && (
        <span>{health.error}</span>
      )}
      <span>{t("aiStage2")}</span>
    </section>
  )
}
