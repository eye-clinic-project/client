"use client"

/** My visits, split into Upcoming and Past tabs, with paging. */

import {
  CalendarCheckIcon,
  CalendarPlusIcon,
  ChevronRightIcon,
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"

import { appointmentTone } from "@/components/appointment/appointment-tone"
import { StatusChip } from "@/components/common/status-chip"
import { PageHeader } from "@/components/page/page-header"
import { Pagination } from "@/components/page/pagination"
import { EmptyState, ErrorState, ListSkeleton } from "@/components/page/states"
import { TabBar } from "@/components/page/tab-bar"
import { useFormat } from "@/lib/i18n/use-labels"
import { useListMyAppointmentsQuery } from "@/services/appointment.service"

const SIZE = 10

export function VisitsView() {
  const t = useTranslations("patient.visits")
  const tc = useTranslations("common")
  const format = useFormat()
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming")
  const [page, setPage] = useState(1)
  // "Now" fixed at mount so the query arguments (and cache key) don't change every render.
  const now = useMemo(() => new Date().toISOString(), [])
  const params = tab === "upcoming" ? { from: now } : { to: now }
  const { data, isLoading, isError, refetch } = useListMyAppointmentsQuery({
    ...params,
    page,
    size: SIZE,
  })
  const { data: upcomingCount } = useListMyAppointmentsQuery({
    from: now,
    size: 1,
  })

  const docs = useMemo(() => {
    const list = [...(data?.docs ?? [])]
    return tab === "upcoming"
      ? list.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      : list.sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
  }, [data, tab])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("lead")}
        actions={
          <Link
            href="/patient/book"
            className="inline-flex min-h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <CalendarPlusIcon className="size-4" aria-hidden="true" />
            {tc("bookVisit")}
          </Link>
        }
      />
      <TabBar
        label={t("views")}
        value={tab}
        onChange={(value) => {
          setTab(value)
          setPage(1)
        }}
        items={[
          {
            value: "upcoming",
            label: t("upcoming"),
            count: upcomingCount?.count || undefined,
          },
          { value: "past", label: t("past") },
        ]}
      />
      <div className="flex max-w-[880px] flex-col gap-4">
        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : docs.length === 0 ? (
          <EmptyState
            icon={CalendarCheckIcon}
            title={tab === "upcoming" ? t("empty") : t("emptyPast")}
            description={t("emptyHint")}
            action={
              <Link
                href="/patient/book"
                className="text-sm font-semibold text-brand hover:text-brand-strong"
              >
                {tc("bookVisit")}
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col border border-b-0 border-border">
            {docs.map((appointment) => {
              const pending =
                appointment.changeRequest?.status === "pending"
                  ? appointment.changeRequest
                  : null
              return (
                <li
                  key={appointment._id}
                  className="border-b border-border bg-card"
                >
                  <Link
                    href={`/patient/appointments/${appointment._id}`}
                    className="flex items-center gap-4 px-4 py-4 hover:bg-muted"
                  >
                    <span className="flex w-16 shrink-0 flex-col items-center border border-border py-2">
                      <span className="text-xs text-subtle">
                        {format.weekday(appointment.scheduledAt)}
                      </span>
                      <span className="text-xl font-semibold tabular-nums">
                        {format.dayNumber(appointment.scheduledAt)}
                      </span>
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-sm font-semibold">
                        {format.monthYear(appointment.scheduledAt)} ·{" "}
                        {format.time(appointment.scheduledAt)}
                      </span>
                      <span className="truncate text-[13px] text-muted-foreground">
                        {t("withDoctor", {
                          name: tc("doctorName", {
                            name: appointment.doctor?.name ?? "",
                          }),
                        })}
                        {appointment.reason && ` · ${appointment.reason}`}
                      </span>
                    </span>
                    <StatusChip tone={appointmentTone(appointment)}>
                      {pending
                        ? pending.type === "cancel"
                          ? t("pendingCancel")
                          : t("pendingReschedule")
                        : tc(`appointmentStatus.${appointment.status}`)}
                    </StatusChip>
                    <ChevronRightIcon
                      className="size-4 shrink-0 text-subtle rtl:rotate-180"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        {data && data.pages > 1 && (
          <Pagination
            page={page}
            size={SIZE}
            total={data.count}
            pages={data.pages}
            onChange={setPage}
          />
        )}
      </div>
    </div>
  )
}
