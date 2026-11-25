"use client"

import { useMemo } from "react"

import { endOfDay, startOfDay } from "@/lib/format"
import { useListMyAppointmentsQuery } from "@/services/appointment.service"

/**
 * Today's non-cancelled appointments sorted by time, and the next upcoming one.
 * Used by both the summary card and the schedule; the query cache shares the request.
 */
export function useTodaysAppointments({ skip }: { skip: boolean }) {
  // Today's range, computed once so the query argument (cache key) stays stable.
  const today = useMemo(
    () => ({ from: startOfDay().toISOString(), to: endOfDay().toISOString() }),
    []
  )
  const { data } = useListMyAppointmentsQuery({ ...today, size: 20 }, { skip })

  const upcoming = useMemo(
    () =>
      (data?.docs ?? [])
        .filter((appointment) => appointment.status !== "cancelled")
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
    [data]
  )
  const next = upcoming.find(
    (appointment) => new Date(appointment.scheduledAt) > new Date()
  )

  return { loaded: data !== undefined, upcoming, next }
}
