"use client"

import { useTranslations } from "next-intl"

import { StatusChip } from "@/components/common/status-chip"
import type { Tone } from "@/lib/format"
import { useFormat } from "@/lib/i18n/use-labels"
import type { Appointment, AppointmentStatus } from "@/types/api"

/** Appointments with this patient, with a status chip each. */
export function VisitList({
  visits,
  compact,
}: {
  visits: Appointment[]
  compact?: boolean
}) {
  const t = useTranslations("patients.detail")
  const tc = useTranslations("common")
  const format = useFormat()
  if (visits.length === 0)
    return <p className="text-sm text-subtle">{t("noVisits")}</p>
  const tone = (status: AppointmentStatus): Tone =>
    status === "confirmed"
      ? "info"
      : status === "completed"
        ? "success"
        : status === "pending"
          ? "warning"
          : "neutral"
  return (
    <ul
      className={
        compact
          ? "flex flex-col gap-3"
          : "flex flex-col border border-b-0 border-border"
      }
    >
      {visits.map((visit) => (
        <li
          key={visit._id}
          className={
            compact
              ? "flex items-start justify-between gap-3"
              : "flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3.5"
          }
        >
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-semibold">
              {format.date(visit.scheduledAt)}, {format.time(visit.scheduledAt)}
            </span>
            {visit.reason && (
              <span className="truncate text-xs text-subtle">
                {visit.reason}
              </span>
            )}
          </span>
          <StatusChip tone={tone(visit.status)}>
            {tc(`appointmentStatus.${visit.status}`)}
          </StatusChip>
        </li>
      ))}
    </ul>
  )
}
