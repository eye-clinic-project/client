"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"

import { StatusChip } from "@/components/common/status-chip"
import { useFormat } from "@/lib/i18n/use-labels"
import type { Appointment } from "@/types/api"

import { useTodaysAppointments } from "./use-todays-appointments"

/** Today's appointments: time, patient, reason and status (or "request" if one is pending). */
export function TodaySchedule({ locked }: { locked: boolean }) {
  const t = useTranslations("dashboard")
  const { upcoming } = useTodaysAppointments({ skip: locked })

  return (
    <section
      aria-labelledby="today-title"
      className="flex min-w-0 flex-[1_1_320px] flex-col gap-3.5 border border-border bg-card px-5 py-[18px]"
    >
      <div className="flex items-center justify-between">
        <h2 id="today-title" className="text-lg font-semibold">
          {t("todayTitle")}
        </h2>
        <Link
          href="/doctor/appointments"
          className="text-[13px] font-semibold text-brand hover:text-brand-strong"
        >
          {t("schedule")}
        </Link>
      </div>
      {upcoming.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("noAppointments")}
        </p>
      ) : (
        <ul className="flex flex-col">
          {upcoming.map((appointment) => (
            <ScheduleItem key={appointment._id} appointment={appointment} />
          ))}
        </ul>
      )}
    </section>
  )
}

function ScheduleItem({ appointment }: { appointment: Appointment }) {
  const t = useTranslations("dashboard")
  const tc = useTranslations("common")
  const format = useFormat()
  const requestPending = appointment.changeRequest?.status === "pending"
  const tone = requestPending
    ? "warning"
    : appointment.status === "confirmed"
      ? "success"
      : "neutral"

  return (
    <li className="flex items-center gap-3 border-t border-border py-3 first:border-t-0">
      <span className="w-12 text-sm font-semibold tabular-nums">
        {format.time(appointment.scheduledAt)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold">
          {appointment.patient?.name ?? t("patient")}
        </span>
        <span className="truncate text-xs text-subtle">
          {appointment.reason ?? t("consultation")}
        </span>
      </span>
      <StatusChip tone={tone}>
        {requestPending
          ? t("request")
          : tc(`appointmentStatus.${appointment.status}`)}
      </StatusChip>
    </li>
  )
}
