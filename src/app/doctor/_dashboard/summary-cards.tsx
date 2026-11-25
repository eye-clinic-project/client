"use client"

import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { useFormat } from "@/lib/i18n/use-labels"
import { cn } from "@/lib/utils"
import { useListAnalysesQuery } from "@/services/analysis.service"
import { useListMyAppointmentsQuery } from "@/services/appointment.service"

import { QUEUE_FILTERS } from "./review-queue"
import { useTodaysAppointments } from "./use-todays-appointments"

/**
 * The four counters: awaiting review (+ DR found), in progress (+ failed),
 * today's appointments (+ next one), and pending cancel/reschedule requests.
 * Count queries use `size: 1`: only `count` is read.
 */
export function SummaryCards({ locked }: { locked: boolean }) {
  const t = useTranslations("dashboard")
  const format = useFormat()
  const skip = locked

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
  const { data: requests } = useListMyAppointmentsQuery(
    { pendingRequest: true, size: 20 },
    { skip }
  )
  const today = useTodaysAppointments({ skip })

  const cancelRequests =
    requests?.docs.filter((item) => item.changeRequest?.type === "cancel")
      .length ?? 0
  const rescheduleRequests = (requests?.docs.length ?? 0) - cancelRequests

  // Locked doctors see zeros instead of skeletons that never resolve.
  const value = (count: number | undefined) => (locked ? 0 : count)

  return (
    <section
      aria-label={t("summary")}
      className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4"
    >
      <SummaryCard
        label={t("awaiting")}
        value={value(pending?.count)}
        detail={t("withDr", { count: withDr?.count ?? 0 })}
        detailClass={withDr?.count ? "font-medium text-warning" : undefined}
      />
      <SummaryCard
        label={t("inProgress")}
        value={value(processing?.count)}
        detail={t("failedCount", { count: failed?.count ?? 0 })}
        detailClass={failed?.count ? "font-medium text-danger" : undefined}
      />
      <SummaryCard
        label={t("today")}
        value={value(today.loaded ? today.upcoming.length : undefined)}
        detail={
          today.next
            ? t("nextAt", {
                time: format.time(today.next.scheduledAt),
                name: today.next.patient?.name ?? t("patient"),
              })
            : t("nothingElse")
        }
      />
      <SummaryCard
        label={t("requests")}
        value={value(requests?.count)}
        detail={t("requestSplit", {
          cancel: cancelRequests,
          reschedule: rescheduleRequests,
        })}
      />
    </section>
  )
}

/** One counter card. `value === undefined` shows a skeleton. */
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
