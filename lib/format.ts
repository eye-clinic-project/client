import type { ApiUser, DiabetesType, EyeSide, Id } from "@/lib/api-types"

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" })
const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" })
const dayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" })

export const fmtDate = (value?: string | Date | null) => (value ? dateFmt.format(new Date(value)) : "—")
export const fmtTime = (value?: string | Date | null) => (value ? timeFmt.format(new Date(value)) : "—")
export const fmtDateTime = (value?: string | Date | null) =>
  value ? `${fmtDate(value)}, ${fmtTime(value)}` : "—"
export const fmtLongDay = (value: string | Date = new Date()) => dayFmt.format(new Date(value))

/** "12 min ago", "Yesterday", or a date. */
export function fmtRelative(value?: string | null): string {
  if (!value) return "—"
  const then = new Date(value)
  const minutes = Math.round((Date.now() - then.getTime()) / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  const today = new Date()
  if (then.toDateString() === today.toDateString()) return `Today ${fmtTime(then)}`
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (then.toDateString() === yesterday.toDateString()) return "Yesterday"
  return fmtDate(then)
}

export function initials(name?: string | null) {
  if (!name) return "?"
  return name
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("")
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

export const DIABETES_LABELS: Record<DiabetesType, string> = {
  type1: "Type 1",
  type2: "Type 2",
  gestational: "Gestational",
  other: "Other",
}

export const EYE_LABELS: Record<EyeSide, string> = { left: "Left eye", right: "Right eye", unknown: "Eye not set" }

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

export const doctorName = (name?: string | null) => (name ? (/^Dr\.?\s/i.test(name) ? name : `Dr. ${name}`) : "Your doctor")
