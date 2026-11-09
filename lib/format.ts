import type { ApiUser, DiabetesType, EyeSide, Id } from "@/lib/api-types"
import { getLocale, intlLocale, messages, type Locale } from "@/lib/i18n"

/* Intl formatters are cached per locale; they follow the UI language set by I18nProvider. */
const cache = new Map<string, Intl.DateTimeFormat>()
function fmt(kind: "date" | "time" | "day" | "month" | "weekday" | "dayMonth", locale: Locale = getLocale()) {
  const key = `${locale}:${kind}`
  let f = cache.get(key)
  if (!f) {
    const options: Intl.DateTimeFormatOptions =
      kind === "date"
        ? { day: "numeric", month: "short", year: "numeric" }
        : kind === "time"
          ? { hour: "2-digit", minute: "2-digit" }
          : kind === "day"
            ? { weekday: "long", day: "numeric", month: "long" }
            : kind === "month"
              ? { month: "short" }
              : kind === "weekday"
                ? { weekday: "short" }
                : { weekday: "short", day: "numeric", month: "short" }
    f = new Intl.DateTimeFormat(intlLocale(locale), options)
    cache.set(key, f)
  }
  return f
}

export const fmtDate = (value?: string | Date | null) => (value ? fmt("date").format(new Date(value)) : "—")
export const fmtTime = (value?: string | Date | null) => (value ? fmt("time").format(new Date(value)) : "—")
export const fmtDateTime = (value?: string | Date | null) =>
  value ? `${fmtDate(value)}${getLocale() === "ar" ? "،" : ","} ${fmtTime(value)}` : "—"
export const fmtLongDay = (value: string | Date = new Date()) => fmt("day").format(new Date(value))
export const fmtMonth = (value: string | Date) => fmt("month").format(new Date(value))
export const fmtWeekday = (value: string | Date) => fmt("weekday").format(new Date(value))
export const fmtDayMonth = (value: string | Date) => fmt("dayMonth").format(new Date(value))

/** "12 min ago", "Yesterday", or a date. */
export function fmtRelative(value?: string | null): string {
  if (!value) return "—"
  const t = messages().time
  const then = new Date(value)
  const minutes = Math.round((Date.now() - then.getTime()) / 60000)
  if (minutes < 1) return t.justNow
  if (minutes < 60) return t.minAgo(minutes)
  const today = new Date()
  if (then.toDateString() === today.toDateString()) return t.today(fmtTime(then))
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (then.toDateString() === yesterday.toDateString()) return t.yesterday
  return fmtDate(then)
}

export function greeting() {
  const t = messages().time
  const h = new Date().getHours()
  return h < 12 ? t.goodMorning : h < 18 ? t.goodAfternoon : t.goodEvening
}

export function firstName(name?: string | null) {
  return name?.trim().split(/\s+/)[0] ?? ""
}

export function ageFrom(dateOfBirth?: string | null): number | null {
  if (!dateOfBirth) return null
  const dob = new Date(dateOfBirth)
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--
  return age
}

export const diabetesLabel = (type: DiabetesType) => messages().diabetes[type]
export const eyeLabel = (eye: EyeSide) => messages().eyes[eye]
export const eyeShort = (eye: EyeSide) => messages().eyeShort[eye]

export function fmtBytes(bytes?: number) {
  if (!bytes) return ""
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export const pct = (value?: number | null) => (value === null || value === undefined ? "—" : `${Math.round(value * 100)}%`)

/** A populated user, or null when the API sent only an id. */
export function userOf(value: ApiUser | Id | null | undefined): ApiUser | null {
  return value && typeof value === "object" ? value : null
}

export function idOf(value: ApiUser | Id | null | undefined): Id {
  return !value ? "" : typeof value === "object" ? value.id : value
}

/** "Dr. Nour" / "د. نور" — names already starting with Dr. are kept as they are. */
export const doctorName = (name?: string | null) => {
  const common = messages().common
  if (!name) return common.yourDoctor
  return /^(Dr\.?|د\.)\s/i.test(name) ? name : common.drName(name)
}
