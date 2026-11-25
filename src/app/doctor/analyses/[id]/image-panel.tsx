"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

import { ProtectedImage } from "@/components/common/protected-image"
import { DetailList, Panel } from "@/components/page/panel"
import { formatBytes } from "@/lib/format"
import { useFormat } from "@/lib/i18n/use-labels"
import { cn } from "@/lib/utils"
import type { Analysis } from "@/types/api"

/** Fundus image with an optional Grad-CAM overlay toggle. */
export function ImagePanel({ analysis }: { analysis: Analysis }) {
  const t = useTranslations("analyses.review")
  const tc = useTranslations("common")
  const format = useFormat()
  const [view, setView] = useState<"original" | "cam">("original")
  const showCam = view === "cam" && analysis.hasGradCam
  const toggle = (
    value: "original" | "cam",
    label: string,
    disabled = false
  ) => (
    <button
      type="button"
      aria-pressed={view === value}
      disabled={disabled}
      onClick={() => setView(value)}
      className={cn(
        "min-h-8 px-3 text-[13px] font-semibold disabled:opacity-40",
        view === value
          ? "bg-background text-foreground shadow-[0_1px_2px_rgba(15,30,38,0.12)]"
          : "text-muted-foreground"
      )}
    >
      {label}
    </button>
  )

  return (
    <Panel
      id="image"
      title={t("image")}
      action={
        <div
          role="group"
          aria-label={t("imageView")}
          className="inline-flex gap-1 bg-muted p-1"
        >
          {toggle("original", t("original"))}
          {toggle("cam", t("gradCam"), !analysis.hasGradCam)}
        </div>
      }
      bodyClassName="gap-4"
    >
      <figure className="flex flex-col gap-2">
        <div className="flex aspect-square items-center justify-center bg-black">
          <ProtectedImage
            path={
              showCam
                ? `/analysis/${analysis._id}/grad-cam`
                : `/analysis/${analysis._id}/image`
            }
            alt={showCam ? t("gradCam") : t("image")}
            className="size-full"
          />
        </div>
        <figcaption className="text-xs text-subtle">
          {showCam
            ? t("gradCamCaption")
            : analysis.hasGradCam
              ? t("originalCaption")
              : t("noGradCam")}
        </figcaption>
      </figure>
      <DetailList
        items={[
          {
            label: t("captured"),
            value: analysis.image?.capturedAt
              ? format.dateTime(analysis.image.capturedAt)
              : tc("none"),
          },
          {
            label: t("file"),
            value: analysis.image?.mimeType
              ? [
                  analysis.image.mimeType.split("/")[1]?.toUpperCase(),
                  analysis.image.size ? formatBytes(analysis.image.size) : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : tc("none"),
          },
          {
            label: t("model"),
            value: analysis.modelVersion ? (
              <span dir="ltr">{analysis.modelVersion}</span>
            ) : (
              tc("none")
            ),
          },
          {
            label: t("processing"),
            value:
              analysis.processingMs !== null
                ? t("processingValue", {
                    seconds: format.number(
                      Math.round(analysis.processingMs / 100) / 10
                    ),
                    attempt: analysis.attempts,
                  })
                : tc("none"),
          },
          ...(analysis.image?.notes
            ? [{ label: tc("optional"), value: analysis.image.notes }]
            : []),
        ]}
      />
    </Panel>
  )
}
