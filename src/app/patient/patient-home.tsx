"use client"

/**
 * Patient home dashboard: next appointment, latest reports, assigned doctors,
 * unread notifications, and the push-notifications prompt.
 */

import {
  BellIcon,
  CalendarPlusIcon,
  ChevronRightIcon,
  FileTextIcon,
  MessageSquareIcon,
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useMemo } from "react"

import { appointmentTone } from "@/components/appointment/appointment-tone"
import { StatusChip } from "@/components/common/status-chip"
import { UserAvatar } from "@/components/common/user-avatar"
import { PushPrompt } from "@/components/layout/push-prompt"
import { PageHeader } from "@/components/page/page-header"
import { Panel } from "@/components/page/panel"
import { Skeleton } from "@/components/ui/skeleton"
import { firstName } from "@/lib/format"
import { useFormat, useGreeting } from "@/lib/i18n/use-labels"
import { useListMyAppointmentsQuery } from "@/services/appointment.service"
import { useListMyDoctorsQuery } from "@/services/doctor.service"
import { useGetUnreadCountQuery } from "@/services/notification.service"
import { useListReportsQuery } from "@/services/report.service"

const linkClass = "text-[13px] font-semibold text-brand hover:text-brand-strong"

export function PatientHome({ name }: { name: string }) {
  const t = useTranslations("patient.home")
  const tv = useTranslations("patient.visits")
  const tr = useTranslations("patient.reports")
  const tc = useTranslations("common")
  const format = useFormat()
  const greet = useGreeting()
  const now = useMemo(() => new Date().toISOString(), [])
  const { data: unread } = useGetUnreadCountQuery()
  const { data: reports, isLoading: reportsLoading } = useListReportsQuery({
    size: 3,
  })
  const { data: appointments, isLoading: appointmentsLoading } =
    useListMyAppointmentsQuery({ from: now, size: 10 })
  const { data: doctors, isLoading: doctorsLoading } = useListMyDoctorsQuery()

  const upcoming = useMemo(
    () =>
      [...(appointments?.docs ?? [])]
        .filter((item) => item.status !== "cancelled")
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
    [appointments]
  )
  const next = upcoming[0]
  const latest = reports?.docs[0]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={format.longDate(new Date())}
        title={greet(firstName(name))}
        description={t("lead")}
        actions={
          <>
            {unread?.unreadCount ? (
              <Link
                href="/patient/notifications"
                className="inline-flex min-h-10 items-center gap-2 border border-border px-4 text-sm font-medium hover:bg-muted"
              >
                <BellIcon className="size-4" aria-hidden="true" />
                {t("unread", { count: unread.unreadCount })}
              </Link>
            ) : null}
            <Link
              href="/patient/book"
              className="inline-flex min-h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <CalendarPlusIcon className="size-4" aria-hidden="true" />
              {t("book")}
            </Link>
          </>
        }
      />
      <PushPrompt />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel
          title={t("nextVisit")}
          action={
            <Link href="/patient/appointments" className={linkClass}>
              {tv("title")}
            </Link>
          }
          bodyClassName="gap-4"
        >
          {appointmentsLoading ? (
            <Skeleton className="h-24 w-full rounded-none" />
          ) : !next ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">{t("noVisit")}</p>
              <Link href="/patient/book" className={linkClass}>
                {t("book")}
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <span className="flex w-16 shrink-0 flex-col items-center bg-brand-soft py-2 text-brand-strong">
                  <span className="text-xs">
                    {format.weekday(next.scheduledAt)}
                  </span>
                  <span className="text-2xl font-semibold tabular-nums">
                    {format.dayNumber(next.scheduledAt)}
                  </span>
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-lg font-semibold">
                    {format.monthYear(next.scheduledAt)} ·{" "}
                    {format.time(next.scheduledAt)}
                  </span>
                  <span className="truncate text-sm text-muted-foreground">
                    {tv("withDoctor", {
                      name: tc("doctorName", { name: next.doctor?.name ?? "" }),
                    })}
                  </span>
                  <StatusChip
                    tone={appointmentTone(next)}
                    className="self-start"
                  >
                    {next.changeRequest?.status === "pending"
                      ? next.changeRequest.type === "cancel"
                        ? tv("pendingCancel")
                        : tv("pendingReschedule")
                      : tc(`appointmentStatus.${next.status}`)}
                  </StatusChip>
                </div>
              </div>
              <Link
                href={`/patient/appointments/${next._id}`}
                className={linkClass}
              >
                {t("viewVisit")}
              </Link>
              {upcoming.length > 1 && (
                <ul className="flex flex-col border-t border-border">
                  {upcoming.slice(1, 4).map((item) => (
                    <li key={item._id}>
                      <Link
                        href={`/patient/appointments/${item._id}`}
                        className="flex items-center justify-between gap-3 border-b border-border py-2.5 text-sm hover:bg-muted"
                      >
                        <span>
                          {format.fullDate(item.scheduledAt)} ·{" "}
                          {format.time(item.scheduledAt)}
                        </span>
                        <ChevronRightIcon
                          className="size-4 text-subtle rtl:rotate-180"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Panel>
        <Panel
          title={t("latestReport")}
          action={
            <Link href="/patient/reports" className={linkClass}>
              {t("allReports")}
            </Link>
          }
          bodyClassName="gap-4"
        >
          {reportsLoading ? (
            <Skeleton className="h-24 w-full rounded-none" />
          ) : !latest ? (
            <p className="text-sm text-muted-foreground">{t("noReport")}</p>
          ) : (
            <>
              <div className="flex items-start gap-3.5">
                <span className="inline-flex size-11 shrink-0 items-center justify-center bg-brand-soft text-brand-strong">
                  <FileTextIcon className="size-5" aria-hidden="true" />
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-semibold">
                      {latest.title}
                    </span>
                    {!latest.viewedAt && (
                      <StatusChip tone="info">{t("newReport")}</StatusChip>
                    )}
                  </span>
                  <span className="text-[13px] text-muted-foreground">
                    {tr("from", {
                      name: tc("doctorName", {
                        name: latest.doctor?.name ?? "",
                      }),
                    })}{" "}
                    ·{" "}
                    {tr("sent", {
                      date: format.date(latest.sentAt ?? latest.createdAt),
                    })}
                  </span>
                  {latest.content && (
                    <p
                      className="line-clamp-3 text-sm leading-relaxed"
                      dir="auto"
                    >
                      {latest.content}
                    </p>
                  )}
                </div>
              </div>
              <Link
                href={`/patient/reports/${latest._id}`}
                className={linkClass}
              >
                {t("openReport")}
              </Link>
            </>
          )}
        </Panel>
      </div>
      <Panel
        title={t("doctors")}
        action={
          <Link href="/patient/doctors" className={linkClass}>
            {t("allDoctors")}
          </Link>
        }
      >
        {doctorsLoading ? (
          <Skeleton className="h-16 w-full rounded-none" />
        ) : !doctors || doctors.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noDoctors")}</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {doctors.map((doctor) => (
              <li
                key={doctor._id}
                className="flex items-center gap-3 border border-border p-3"
              >
                <UserAvatar
                  name={doctor.name}
                  src={doctor.avatarUrl}
                  className="size-10"
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold">
                    {tc("doctorName", { name: doctor.name })}
                  </span>
                  <span className="truncate text-xs text-subtle">
                    {doctor.clinicName ?? doctor.specialty ?? doctor.city}
                  </span>
                </span>
                <Link
                  href={`/patient/messages?doctor=${doctor._id}`}
                  aria-label={`${tc("message")} ${tc("doctorName", { name: doctor.name })}`}
                  className="inline-flex size-9 items-center justify-center border border-border hover:bg-muted"
                >
                  <MessageSquareIcon className="size-4" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
