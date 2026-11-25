"use client"

/**
 * Doctor home: greeting, summary cards (to review / DR found / processing / failed),
 * a filterable review queue, and today's appointments.
 * Everything is skipped until the doctor is approved (the API would answer 403).
 */

import { BellIcon, SearchIcon, UploadIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useMemo, useState, type FormEvent, type ReactNode } from "react"

import { StatusChip } from "@/components/common/status-chip"
import { PushPrompt } from "@/components/layout/push-prompt"
import { Skeleton } from "@/components/ui/skeleton"
import { endOfDay, firstName, startOfDay } from "@/lib/format"
import {
  useAnalysisLabels,
  useFormat,
  useGreeting,
} from "@/lib/i18n/use-labels"
import { cn } from "@/lib/utils"
import {
  useGetAiHealthQuery,
  useListAnalysesQuery,
  type AnalysisListParams,
} from "@/services/analysis.service"
import { useListMyAppointmentsQuery } from "@/services/appointment.service"
import { useGetMyVerificationQuery } from "@/services/doctor.service"
import { useGetUnreadCountQuery } from "@/services/notification.service"

// Review-queue filter buttons → analysis list filters.
const QUEUE_FILTERS = {
  pending: {
    label: "filterPending",
    params: { reviewed: false, status: "completed" },
  },
  dr: { label: "filterDr", params: { hasDR: true, reviewed: false } },
  failed: { label: "filterFailed", params: { status: "failed" } },
} as const satisfies Record<
  string,
  { label: string; params: AnalysisListParams }
>

type QueueFilter = keyof typeof QUEUE_FILTERS

function SummaryCard({
  label,
  value,
  detail,
  detailClass,
}: {
  label: string
  value?: number
  detail: ReactNode
  detailClass?: string
}) {
  return (
    <div className="flex flex-col gap-2.5 border border-border bg-card p-5">
      <span className="text-[13px] font-medium text-subtle">{label}</span>
      {value === undefined ? (
        <Skeleton className="h-10 w-12" />
      ) : (
        <span className="text-[34px] leading-none font-semibold">{value}</span>
      )}
      <span className={cn("text-[13px] text-muted-foreground", detailClass)}>
        {detail}
      </span>
    </div>
  )
}

export function DoctorDashboard({ name }: { name: string }) {
  const router = useRouter()
  const t = useTranslations("dashboard")
  const tc = useTranslations("common")
  const format = useFormat()
  const labels = useAnalysisLabels()
  const greet = useGreeting()
  const [filter, setFilter] = useState<QueueFilter>("pending")
  const { data: verification } = useGetMyVerificationQuery()
  const skip = verification?.status !== "approved"

  // Today's range, computed once so query arguments stay stable.
  const today = useMemo(
    () => ({ from: startOfDay().toISOString(), to: endOfDay().toISOString() }),
    []
  )

  // Counters for the summary cards (size 1 → only `count` is used).
  const { data: pending } = useListAnalysesQuery(
    { ...QUEUE_FILTERS.pending.params, size: 1 },
    { skip }
  )
  const { data: withDr } = useListAnalysesQuery(
    { ...QUEUE_FILTERS.dr.params, size: 1 },
    { skip }
  )
  const { data: processing } = useListAnalysesQuery(
    { status: "processing", size: 1 },
    { skip }
  )
  const { data: failed } = useListAnalysesQuery(
    { status: "failed", size: 1 },
    { skip }
  )
  const { data: queue, isFetching: queueLoading } = useListAnalysesQuery(
    { ...QUEUE_FILTERS[filter].params, size: 8 },
    { skip, pollingInterval: 30_000 }
  )
  const { data: todays } = useListMyAppointmentsQuery(
    { ...today, size: 20 },
    { skip }
  )
  const { data: requests } = useListMyAppointmentsQuery(
    { pendingRequest: true, size: 20 },
    { skip }
  )
  const { data: health, isError: healthError } = useGetAiHealthQuery(
    undefined,
    { skip, pollingInterval: 60_000 }
  )
  const { data: unread } = useGetUnreadCountQuery()

  const upcoming = useMemo(
    () =>
      (todays?.docs ?? [])
        .filter((appointment) => appointment.status !== "cancelled")
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
    [todays]
  )
  const next = upcoming.find(
    (appointment) => new Date(appointment.scheduledAt) > new Date()
  )
  const cancelRequests =
    requests?.docs.filter((item) => item.changeRequest?.type === "cancel")
      .length ?? 0
  const rescheduleRequests = (requests?.docs.length ?? 0) - cancelRequests

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = new FormData(event.currentTarget)
      .get("search")
      ?.toString()
      .trim()
    router.push(
      query
        ? `/doctor/patients?search=${encodeURIComponent(query)}`
        : "/doctor/patients"
    )
  }

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-subtle">
            {format.longDate(new Date())}
          </span>
          <h1 className="text-[30px] font-semibold tracking-[-0.01em]">
            {greet(t("greeting", { name: firstName(name) }))}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form role="search" onSubmit={onSearch}>
            <label className="flex h-11 w-[280px] max-w-full items-center gap-2 border border-border bg-card px-3.5">
              <SearchIcon className="size-4 text-subtle" aria-hidden="true" />
              <span className="sr-only">{t("searchLabel")}</span>
              <input
                name="search"
                type="search"
                placeholder={t("searchPlaceholder")}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </label>
          </form>
          <Link
            href="/doctor/notifications"
            aria-label={t("notifications", { count: unread?.unreadCount ?? 0 })}
            className="relative inline-flex size-11 items-center justify-center border border-border bg-card"
          >
            <BellIcon className="size-[18px]" aria-hidden="true" />
            {unread?.unreadCount ? (
              <span className="absolute end-2.5 top-2 size-2 rounded-full border-2 border-background bg-danger" />
            ) : null}
          </Link>
          <Link
            href="/doctor/analyses/new"
            aria-disabled={skip}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 bg-primary px-[18px] text-sm font-semibold text-primary-foreground hover:bg-primary/90",
              skip && "pointer-events-none opacity-50"
            )}
          >
            <UploadIcon className="size-4" aria-hidden="true" />
            {t("newAnalysis")}
          </Link>
        </div>
      </header>

      <PushPrompt />

      <section
        aria-label={t("summary")}
        className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4"
      >
        <SummaryCard
          label={t("awaiting")}
          value={skip ? 0 : pending?.count}
          detail={t("withDr", { count: withDr?.count ?? 0 })}
          detailClass={withDr?.count ? "font-medium text-warning" : undefined}
        />
        <SummaryCard
          label={t("inProgress")}
          value={skip ? 0 : processing?.count}
          detail={t("failedCount", { count: failed?.count ?? 0 })}
          detailClass={failed?.count ? "font-medium text-danger" : undefined}
        />
        <SummaryCard
          label={t("today")}
          value={skip ? 0 : todays ? upcoming.length : undefined}
          detail={
            next
              ? t("nextAt", {
                  time: format.time(next.scheduledAt),
                  name: next.patient?.name ?? t("patient"),
                })
              : t("nothingElse")
          }
        />
        <SummaryCard
          label={t("requests")}
          value={skip ? 0 : requests?.count}
          detail={t("requestSplit", {
            cancel: cancelRequests,
            reschedule: rescheduleRequests,
          })}
        />
      </section>

      {!skip && (health || healthError) && (
        <section
          aria-label={t("aiService")}
          className={cn(
            "flex flex-wrap items-center gap-x-6 gap-y-3 border px-5 py-3.5 text-sm",
            health?.available
              ? "border-success/30 bg-success-soft text-success"
              : "border-danger/30 bg-danger-soft text-danger"
          )}
        >
          <span className="inline-flex items-center gap-2 font-semibold">
            <span
              className={cn(
                "size-2 rounded-full",
                health?.available ? "bg-success" : "bg-danger"
              )}
            />
            {health?.available ? t("aiOnline") : t("aiOffline")}
          </span>
          {health?.modelVersion && (
            <span dir="auto">
              {t("aiModel", { version: health.modelVersion })}
            </span>
          )}
          {health?.mode === "mock" && <span>{t("aiMock")}</span>}
          {health && !health.available && health.error && (
            <span>{health.error}</span>
          )}
          <span>{t("aiStage2")}</span>
        </section>
      )}

      <div className="flex flex-wrap items-start gap-6">
        <section
          aria-labelledby="queue-title"
          className="min-w-0 flex-[999_1_560px] overflow-hidden border border-border bg-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-[18px]">
            <h2 id="queue-title" className="text-lg font-semibold">
              {t("queue")}
            </h2>
            <div
              className="inline-flex gap-1.5 text-[13px]"
              role="group"
              aria-label={t("filterQueue")}
            >
              {(Object.keys(QUEUE_FILTERS) as QueueFilter[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    "min-h-[34px] px-3",
                    filter === key
                      ? "bg-foreground font-semibold text-background"
                      : "border border-border font-medium text-muted-foreground"
                  )}
                >
                  {t(QUEUE_FILTERS[key].label)}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="text-start text-xs tracking-[0.04em] text-subtle uppercase">
                  <th scope="col" className="px-5 py-3 font-semibold">
                    {t("patient")}
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    {t("eye")}
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    {t("stage1")}
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    {t("status")}
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    {t("uploaded")}
                  </th>
                  <th scope="col" className="px-5 py-3">
                    <span className="sr-only">{t("action")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {queueLoading && !queue
                  ? Array.from({ length: 4 }, (_, index) => (
                      <tr key={index} className="border-t border-border">
                        <td colSpan={6} className="px-5 py-3.5">
                          <Skeleton className="h-8 w-full" />
                        </td>
                      </tr>
                    ))
                  : queue?.docs.map((analysis) => {
                      const stage1 = labels.stage1(analysis)
                      const status = labels.status(analysis)
                      const review = labels.review(analysis)
                      return (
                        <tr
                          key={analysis._id}
                          className="border-t border-border"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold">
                                {analysis.patient?.name ?? t("unassigned")}
                              </span>
                              <span className="text-xs text-subtle">
                                {analysis.image?.originalName ??
                                  analysis._id.slice(-6)}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3.5 text-muted-foreground">
                            {labels.eyeShort(analysis.image?.eye)}
                          </td>
                          <td className="px-3 py-3.5">
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={cn(
                                  "font-semibold",
                                  stage1.tone === "warning" && "text-warning",
                                  stage1.tone === "danger" && "text-danger",
                                  stage1.tone === "success" && "text-success"
                                )}
                              >
                                {stage1.label}
                              </span>
                              <span className="text-xs text-subtle">
                                {stage1.detail}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3.5">
                            <StatusChip tone={(review ?? status).tone}>
                              {(review ?? status).label}
                            </StatusChip>
                          </td>
                          <td className="px-3 py-3.5 text-muted-foreground">
                            {format.relative(analysis.createdAt)}
                          </td>
                          <td className="px-5 py-3.5 text-end">
                            <Link
                              href={`/doctor/analyses/${analysis._id}`}
                              className="inline-flex min-h-9 items-center border border-border px-3.5 text-[13px] font-semibold hover:bg-muted"
                            >
                              {analysis.status === "failed"
                                ? t("open")
                                : analysis.reviewedAt
                                  ? t("view")
                                  : t("review")}
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                {queue && queue.docs.length === 0 && (
                  <tr className="border-t border-border">
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-muted-foreground"
                    >
                      {t("emptyQueue")}
                    </td>
                  </tr>
                )}
                {skip && (
                  <tr className="border-t border-border">
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-muted-foreground"
                    >
                      {t("locked")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

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
                <li
                  key={appointment._id}
                  className="flex items-center gap-3 border-t border-border py-3 first:border-t-0"
                >
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
                  <StatusChip
                    tone={
                      appointment.changeRequest?.status === "pending"
                        ? "warning"
                        : appointment.status === "confirmed"
                          ? "success"
                          : "neutral"
                    }
                  >
                    {appointment.changeRequest?.status === "pending"
                      ? t("request")
                      : tc(`appointmentStatus.${appointment.status}`)}
                  </StatusChip>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
