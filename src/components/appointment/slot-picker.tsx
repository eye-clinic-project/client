"use client"

/**
 * Patient-side picker: choose a day (next 14 days), then a free time slot of a doctor.
 * Booked and already-past slots are hidden. Used for booking and rescheduling.
 */

import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { addDays, sameDay, toDateInput } from "@/lib/dates"
import { useFormat } from "@/lib/i18n/use-labels"
import { cn } from "@/lib/utils"
import { useListDoctorSlotsQuery } from "@/services/appointment.service"
import type { Slot } from "@/types/api"

const DAYS = 14

export function SlotPicker({
  doctorId,
  value,
  onChange,
  invalid,
}: {
  doctorId: string
  value: Slot | null
  onChange: (slot: Slot | null) => void
  invalid?: boolean
}) {
  const t = useTranslations("patient.book")
  const format = useFormat()
  const days = useMemo(
    () =>
      Array.from({ length: DAYS }, (_, index) => addDays(new Date(), index)),
    []
  )
  const [day, setDay] = useState(days[0])
  const { data, isFetching } = useListDoctorSlotsQuery({
    doctorId,
    date: toDateInput(day),
  })
  // Only slots that are still free and haven't started yet.
  const slots = (data ?? []).filter(
    (slot) => !slot.isBooked && new Date(slot.startAt) > new Date()
  )

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">{t("day")}</legend>
        <div
          role="radiogroup"
          aria-label={t("days")}
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {days.map((item) => {
            const selected = sameDay(item, day)
            return (
              <button
                key={item.toISOString()}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setDay(item)
                  onChange(null)
                }}
                className={cn(
                  "flex min-w-16 shrink-0 flex-col items-center gap-0.5 border px-3 py-2.5 text-sm",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted"
                )}
              >
                <span
                  className={cn(
                    "text-xs",
                    selected ? "text-primary-foreground/80" : "text-subtle"
                  )}
                >
                  {format.weekday(item)}
                </span>
                <span className="text-lg font-semibold tabular-nums">
                  {format.dayNumber(item)}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">{t("time")}</legend>
        {isFetching && !data ? (
          <Skeleton className="h-24 w-full rounded-none" />
        ) : slots.length === 0 ? (
          <p className="border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            {t("noSlots")}
          </p>
        ) : (
          <div
            role="radiogroup"
            aria-label={t("time")}
            aria-invalid={invalid || undefined}
            className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2"
          >
            {slots.map((slot) => {
              const selected = value?._id === slot._id
              return (
                <button
                  key={slot._id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange(slot)}
                  className={cn(
                    "min-h-11 border px-3 text-sm font-semibold tabular-nums",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary",
                    invalid && !value && "border-danger"
                  )}
                >
                  {format.time(slot.startAt)}
                </button>
              )
            })}
          </div>
        )}
      </fieldset>
    </div>
  )
}
