"use client"

/**
 * Doctor's weekly calendar of availability slots, colored by state
 * (open / booked / change requested / completed), with details of the selected
 * slot and a panel of pending cancel/reschedule requests to approve or reject.
 */

import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useMemo, useState } from "react"

import { PageHeader } from "@/components/page/page-header"
import { ListSkeleton } from "@/components/page/states"
import { Button } from "@/components/ui/button"
import { addDays, sameDay, startOfWeek } from "@/lib/dates"
import { useFormat } from "@/lib/i18n/use-labels"
import { cn } from "@/lib/utils"
import {
  useListMyAppointmentsQuery,
  useListMyAvailabilityQuery,
} from "@/services/appointment.service"
import type { Appointment, Slot } from "@/types/api"

import { AvailabilityForm } from "./availability-form"
import { RequestsPanel } from "./requests-panel"
import { SelectedSlot } from "./selected-slot"

type SlotState = "open" | "booked" | "pending" | "completed"

const SLOT_CLASS: Record<SlotState, string> = {
  open: "border-brand/40 bg-brand-soft text-brand-strong",
  booked: "border-border bg-card text-foreground",
  pending: "border-warning/40 bg-warning-soft text-warning",
  completed: "border-success/30 bg-success-soft text-success",
}

/** Display state of a slot, using the appointment booked into it (if any). */
function slotState(
  slot: Slot,
  appointment: Appointment | undefined
): SlotState {
  if (!slot.isBooked || !appointment) return "open"
  if (appointment.changeRequest?.status === "pending") return "pending"
  if (appointment.status === "completed") return "completed"
  return "booked"
}

export function AppointmentsView() {
  const t = useTranslations("appointments")
  const locale = useLocale()
  const format = useFormat()
  // Arabic calendars start on Saturday, English (UK) on Monday.
  const weekStartsOn = locale === "ar" ? 6 : 1
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), weekStartsOn)
  )
  const [adding, setAdding] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const weekEnd = addDays(weekStart, 7)
  const range = { from: weekStart.toISOString(), to: weekEnd.toISOString() }
  const { data: slots, isLoading } = useListMyAvailabilityQuery(range)
  const { data: appointments } = useListMyAppointmentsQuery({
    ...range,
    size: 100,
  })
  const { data: requests } = useListMyAppointmentsQuery({
    pendingRequest: true,
    size: 20,
  })

  // Appointment for each booked slot id.
  const bySlot = useMemo(
    () =>
      new Map(
        (appointments?.docs ?? [])
          .filter((item) => item.slot)
          .map((item) => [item.slot as string, item])
      ),
    [appointments]
  )
  const days = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index)
  )
  const selected = slots?.find((slot) => slot._id === selectedId) ?? null

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("lead")}
        actions={
          <>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={t("previousWeek")}
                onClick={() => setWeekStart(addDays(weekStart, -7))}
                className="inline-flex size-10 items-center justify-center border border-border hover:bg-muted"
              >
                <ChevronLeftIcon
                  className="size-4 rtl:rotate-180"
                  aria-hidden="true"
                />
              </button>
              <span className="min-w-44 px-2 text-center text-sm font-semibold">
                {format.shortDate(weekStart)} –{" "}
                {format.date(addDays(weekStart, 6))}
              </span>
              <button
                type="button"
                aria-label={t("nextWeek")}
                onClick={() => setWeekStart(addDays(weekStart, 7))}
                className="inline-flex size-10 items-center justify-center border border-border hover:bg-muted"
              >
                <ChevronRightIcon
                  className="size-4 rtl:rotate-180"
                  aria-hidden="true"
                />
              </button>
            </div>
            <Button
              aria-expanded={adding}
              onClick={() => setAdding((value) => !value)}
              className="h-10 gap-2 rounded-none px-4"
            >
              <PlusIcon className="size-4" aria-hidden="true" />
              {t("add")}
            </Button>
          </>
        }
      />
      {adding && (
        <AvailabilityForm
          onCreated={(date) => {
            setAdding(false)
            setWeekStart(startOfWeek(date, weekStartsOn))
          }}
        />
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section
          aria-labelledby="week-title"
          className="flex min-w-0 flex-col gap-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="week-title" className="text-[15px] font-semibold">
              {sameDay(weekStart, startOfWeek(new Date(), weekStartsOn))
                ? t("thisWeek")
                : `${format.shortDate(weekStart)} – ${format.shortDate(addDays(weekStart, 6))}`}
            </h2>
            <ul
              aria-label={t("legend")}
              className="flex flex-wrap gap-3 text-xs text-subtle"
            >
              {(["open", "booked", "pending", "completed"] as const).map(
                (state) => (
                  <li key={state} className="flex items-center gap-1.5">
                    <span
                      className={cn("size-3 border", SLOT_CLASS[state])}
                      aria-hidden="true"
                    />
                    {state === "pending" ? t("requestPending") : t(state)}
                  </li>
                )
              )}
            </ul>
          </div>
          {isLoading ? (
            <ListSkeleton rows={4} />
          ) : (
            <div className="grid grid-cols-1 gap-2 overflow-x-auto sm:grid-cols-[repeat(7,minmax(120px,1fr))]">
              {days.map((day) => {
                const daySlots = (slots ?? [])
                  .filter((slot) => sameDay(slot.startAt, day))
                  .sort((a, b) => a.startAt.localeCompare(b.startAt))
                const today = sameDay(day, new Date())
                return (
                  <div
                    key={day.toISOString()}
                    className="flex min-w-0 flex-col border border-border bg-card"
                  >
                    <div
                      className={cn(
                        "flex items-baseline justify-between gap-2 border-b border-border px-3 py-2",
                        today && "bg-brand-soft"
                      )}
                    >
                      <span className="text-xs font-semibold text-subtle uppercase">
                        {format.weekday(day)}
                      </span>
                      <span
                        className={cn(
                          "text-lg font-semibold",
                          today && "text-brand-strong"
                        )}
                      >
                        {format.dayNumber(day)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5 p-2">
                      {daySlots.length === 0 && (
                        <span className="px-1 py-2 text-xs text-subtle">
                          {t("noSlots")}
                        </span>
                      )}
                      {daySlots.map((slot) => {
                        const appointment = bySlot.get(slot._id)
                        const state = slotState(slot, appointment)
                        return (
                          <button
                            key={slot._id}
                            type="button"
                            aria-pressed={selectedId === slot._id}
                            onClick={() => setSelectedId(slot._id)}
                            className={cn(
                              "flex flex-col items-start border px-2 py-1.5 text-start text-xs",
                              SLOT_CLASS[state],
                              selectedId === slot._id &&
                                "ring-2 ring-brand ring-offset-1 ring-offset-background"
                            )}
                          >
                            <span className="font-semibold tabular-nums">
                              {format.time(slot.startAt)}
                            </span>
                            <span className="w-full truncate">
                              {appointment?.patient?.name ?? t("open")}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <SelectedSlot
            slot={selected}
            appointment={selected ? bySlot.get(selected._id) : undefined}
            onRemoved={() => setSelectedId(null)}
          />
        </section>
        <RequestsPanel requests={requests?.docs ?? []} />
      </div>
    </div>
  )
}
