import type {
  Analysis,
  AppointmentStatus,
  EyeSide,
  Language,
} from "@/types/api"

export function initials(name: string | undefined | null): string {
  if (!name) return "?"
  const parts = name
    .replace(/^dr\.?\s+/i, "")
    .trim()
    .split(/\s+/)
  return (
    (
      (parts[0]?.[0] ?? "") +
      (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")
    ).toUpperCase() || "?"
  )
}

export function firstName(name: string | undefined | null): string {
  return name?.trim().split(/\s+/)[0] ?? ""
}

export function greeting(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

const locale = (language: Language) => (language === "ar" ? "ar-EG" : "en-GB")

export function formatDate(
  value: string | Date,
  language: Language = "en"
): string {
  return new Intl.DateTimeFormat(locale(language), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

export function formatLongDate(
  value: string | Date,
  language: Language = "en"
): string {
  return new Intl.DateTimeFormat(locale(language), {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(value))
}

export function formatTime(
  value: string | Date,
  language: Language = "en"
): string {
  return new Intl.DateTimeFormat(locale(language), {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export function formatWeekday(
  value: string | Date,
  language: Language = "en"
): string {
  return new Intl.DateTimeFormat(locale(language), { weekday: "short" })
    .format(new Date(value))
    .toUpperCase()
}

export function formatRelative(
  value: string | Date,
  language: Language = "en"
): string {
  const diffSeconds = Math.round(
    (new Date(value).getTime() - Date.now()) / 1000
  )
  const formatter = new Intl.RelativeTimeFormat(locale(language), {
    numeric: "auto",
  })
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ]
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds)
      return formatter.format(Math.round(diffSeconds / seconds), unit)
  }
  return formatter.format(0, "minute")
}

export function startOfDay(date = new Date()): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function endOfDay(date = new Date()): Date {
  const copy = new Date(date)
  copy.setHours(23, 59, 59, 999)
  return copy
}

export const EYE_LABEL: Record<EyeSide, string> = {
  left: "Left",
  right: "Right",
  unknown: "Not set",
}

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
}

export type Tone = "neutral" | "info" | "success" | "warning" | "danger"

export function stage1Summary(analysis: Analysis): {
  label: string
  detail: string
  tone: Tone
} {
  if (analysis.status === "failed")
    return {
      label: "Failed",
      detail: analysis.error ?? "Analysis failed",
      tone: "danger",
    }
  if (analysis.status !== "completed")
    return {
      label: "Processing",
      detail: "Waiting for the AI service",
      tone: "info",
    }
  const confidence = analysis.stage1.confidence
  const detail =
    confidence === null ? "" : `${Math.round(confidence * 100)}% confidence`
  if (analysis.stage1.hasDR)
    return { label: "Signs of DR", detail, tone: "warning" }
  return { label: "No DR detected", detail, tone: "success" }
}

export function analysisStatus(analysis: Analysis): {
  label: string
  tone: Tone
} {
  if (analysis.status === "failed") return { label: "Failed", tone: "danger" }
  if (analysis.status === "pending" || analysis.status === "processing")
    return { label: "Processing", tone: "info" }
  if (analysis.reviewedAt) return { label: "Reviewed", tone: "success" }
  return { label: "Needs review", tone: "warning" }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "0 KB"
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
