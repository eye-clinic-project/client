"use client"

/**
 * Locale-aware formatting and labels for UI code.
 *
 * - useFormat():         dates, times, numbers, percents, "3 hours ago"
 * - useAnalysisLabels(): translated labels + color tone for analysis results
 * - useGreeting():       "Good morning, <name>"
 * - ageFrom():           age in whole years from a birth date
 */

import { useLocale, useTranslations } from "next-intl"
import { useMemo } from "react"

import type { Tone } from "@/lib/format"
import type { Analysis, DrLevel, EyeSide, FindingCode } from "@/types/api"

// Locale passed to Intl formatters (Egyptian Arabic / British English date order).
const intlLocale = (locale: string) => (locale === "ar" ? "ar-EG" : "en-GB")

/** Formatters are created once per locale (Intl formatters are expensive to build). */
export function useFormat() {
  const locale = intlLocale(useLocale())
  return useMemo(() => {
    const make = (options: Intl.DateTimeFormatOptions) => {
      const formatter = new Intl.DateTimeFormat(locale, options)
      return (value: string | Date) => formatter.format(new Date(value))
    }
    const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
    const number = new Intl.NumberFormat(locale)
    const percent = new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 1,
    })
    return {
      locale,
      date: make({ day: "numeric", month: "short", year: "numeric" }),
      shortDate: make({ day: "numeric", month: "short" }),
      longDate: make({ weekday: "long", day: "numeric", month: "long" }),
      fullDate: make({
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      monthYear: make({ month: "long", year: "numeric" }),
      time: make({ hour: "2-digit", minute: "2-digit" }),
      dateTime: make({
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      weekday: make({ weekday: "short" }),
      dayNumber: make({ day: "numeric" }),
      number: (value: number) => number.format(value),
      percent: (value: number) => percent.format(value),
      // "in 2 days" / "5 minutes ago": picks the largest unit that fits.
      relative(value: string | Date) {
        const diff = Math.round((new Date(value).getTime() - Date.now()) / 1000)
        const units: [Intl.RelativeTimeFormatUnit, number][] = [
          ["day", 86_400],
          ["hour", 3_600],
          ["minute", 60],
        ]
        for (const [unit, seconds] of units) {
          if (Math.abs(diff) >= seconds)
            return relative.format(Math.round(diff / seconds), unit)
        }
        return relative.format(0, "minute")
      },
    }
  }, [locale])
}

export function ageFrom(dateOfBirth: string | null | undefined) {
  if (!dateOfBirth) return null
  const birth = new Date(dateOfBirth)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  if (beforeBirthday) age -= 1
  return age
}

export function useAnalysisLabels() {
  const t = useTranslations("common")
  const format = useFormat()
  return useMemo(
    () => ({
      eye: (eye: EyeSide | undefined) => t(`eye.${eye ?? "unknown"}`),
      eyeShort: (eye: EyeSide | undefined) => t(`eye.${eye ?? "unknown"}Short`),
      level: (level: DrLevel) => t(`drLevel.${level}`),
      levelLong: (level: DrLevel) => t(`drLevelLong.${level}`),
      finding: (code: FindingCode) => t(`finding.${code}`),
      // Headline for the AI screening result, by priority:
      // failed → queued → processing → DR found → other disease found →
      // uncertain (SUSPECTED) → healthy.
      stage1(analysis: Analysis): {
        label: string
        detail: string
        tone: Tone
      } {
        if (analysis.status === "failed")
          return {
            label: t("stage1.failed"),
            detail: analysis.error ?? t("stage1.failedDetail"),
            tone: "danger",
          }
        if (analysis.status === "pending")
          return {
            label: t("stage1.queued"),
            detail: t("stage1.queuedDetail"),
            tone: "neutral",
          }
        if (analysis.status !== "completed")
          return {
            label: t("stage1.processing"),
            detail: t("stage1.processingDetail"),
            tone: "info",
          }
        const confidence = analysis.stage1.confidence
        const detail =
          confidence === null
            ? ""
            : t("confidence", {
                value: format.number(Math.round(confidence * 1000) / 10),
              })
        if (analysis.stage1.hasDR)
          return { label: t("stage1.dr"), detail, tone: "danger" }
        const other = analysis.stage1.findings.some(
          (finding) => finding.detected && finding.code !== "N"
        )
        if (other)
          return { label: t("stage1.noDrOther"), detail, tone: "warning" }
        if (analysis.stage1.status === "SUSPECTED")
          return { label: t("stage1.noDrUnsure"), detail, tone: "warning" }
        return { label: t("stage1.noDr"), detail, tone: "success" }
      },
      status(analysis: Analysis): { label: string; tone: Tone } {
        const map: Record<Analysis["status"], Tone> = {
          pending: "neutral",
          processing: "info",
          completed: "success",
          failed: "danger",
        }
        return {
          label: t(`analysisStatus.${analysis.status}`),
          tone: map[analysis.status],
        }
      },
      // Whether a completed analysis still needs the doctor's review (null if not completed).
      review(analysis: Analysis): { label: string; tone: Tone } | null {
        if (analysis.status !== "completed") return null
        return analysis.reviewedAt
          ? { label: t("analysisStatus.reviewed"), tone: "success" }
          : { label: t("analysisStatus.needsReview"), tone: "warning" }
      },
    }),
    [format, t]
  )
}

export function useGreeting() {
  const t = useTranslations("common")
  return (name: string, date = new Date()) => {
    const hour = date.getHours()
    if (hour < 12) return t("greeting.morning", { name })
    if (hour < 18) return t("greeting.afternoon", { name })
    return t("greeting.evening", { name })
  }
}
