"use client"

import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/page/confirm-dialog"
import { PageHeader } from "@/components/page/page-header"
import { DetailList, Panel } from "@/components/page/panel"
import { ListSkeleton } from "@/components/page/states"
import { StatusChip } from "@/components/status-chip"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { UserAvatar } from "@/components/user-avatar"
import { useFormat } from "@/lib/i18n/use-labels"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { cn } from "@/lib/utils"
import {
  useDecideRequestMutation,
  useDeleteAvailabilityMutation,
  useListMyAppointmentsQuery,
  useListMyAvailabilityQuery,
} from "@/service/appointment.service"
import type { Appointment, Slot } from "@/types/api"
import { addDays, sameDay, startOfWeek } from "@/util/dates"
import { AvailabilityForm } from "./availability-form"

type SlotState = "open" | "booked" | "pending" | "completed"

const SLOT_CLASS: Record<SlotState, string> = {
  open: "border-brand/40 bg-brand-soft text-brand-strong",
  booked: "border-border bg-card text-foreground",
  pending: "border-warning/40 bg-warning-soft text-warning",
  completed: "border-success/30 bg-success-soft text-success",
}

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

function SelectedSlot({
  slot,
  appointment,
  onRemoved,
}: {
  slot: Slot | null
  appointment: Appointment | undefined
  onRemoved: () => void
}) {
  const t = useTranslations("appointments")
  const tc = useTranslations("common")
  const format = useFormat()
  const errorText = useErrorText()
  const [remove, { isLoading }] = useDeleteAvailabilityMutation()
  if (!slot)
    return (
      <p className="border border-dashed border-border px-4 py-3 text-sm text-subtle">
        {t("selectHint")}
      </p>
    )
  const heading = `${format.fullDate(slot.startAt)} · ${format.time(slot.startAt)}–${format.time(slot.endAt)}`
  return (
    <Panel title={heading}>
      {slot.isBooked && appointment ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <UserAvatar
              name={appointment.patient?.name ?? "?"}
              src={appointment.patient?.avatarUrl ?? null}
            />
            <span className="flex flex-col">
              <span className="font-semibold">
                {t("bookedBy", { name: appointment.patient?.name ?? "" })}
              </span>
              <StatusChip
                tone={appointment.status === "completed" ? "success" : "info"}
                className="self-start"
              >
                {tc(`appointmentStatus.${appointment.status}`)}
              </StatusChip>
            </span>
          </div>
          <DetailList
            items={[
              {
                label: t("visitReason"),
                value: appointment.reason || t("noReason"),
              },
            ]}
          />
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusChip tone="info">{t("openSlot")}</StatusChip>
          <Button
            variant="outline"
            disabled={isLoading}
            onClick={async () => {
              try {
                await remove(slot._id).unwrap()
                toast.success(t("removed"))
                onRemoved()
              } catch (caught) {
                toast.error(errorText(caught))
              }
            }}
            className="h-10 rounded-none px-4 text-danger hover:text-danger"
          >
            {t("removeSlot")}
          </Button>
        </div>
      )}
    </Panel>
  )
}

function RequestsPanel({ requests }: { requests: Appointment[] }) {
  const t = useTranslations("appointments")
  const format = useFormat()
  const errorText = useErrorText()
  const [decide, { isLoading }] = useDecideRequestMutation()
  const [pending, setPending] = useState<{
    appointment: Appointment
    decision: "approve" | "reject"
  } | null>(null)
  const [note, setNote] = useState("")

  return (
    <aside
      aria-labelledby="requests-title"
      className="flex flex-col border border-border bg-card"
    >
      <h2
        id="requests-title"
        className="flex items-center gap-2 border-b border-border px-5 py-3.5 text-[15px] font-semibold"
      >
        {t("requests")}
        {requests.length > 0 && (
          <span className="bg-warning-soft px-2 py-0.5 text-xs text-warning">
            {requests.length}
          </span>
        )}
      </h2>
      {requests.length === 0 ? (
        <p className="px-5 py-4 text-sm text-subtle">{t("noRequests")}</p>
      ) : (
        <ul className="flex flex-col">
          {requests.map((appointment) => {
            const request = appointment.changeRequest
            if (!request) return null
            return (
              <li
                key={appointment._id}
                className="flex flex-col gap-3 border-b border-border px-5 py-4 last:border-b-0"
              >
                <StatusChip tone="warning" className="self-start">
                  {request.type === "cancel"
                    ? t("cancelRequest")
                    : t("rescheduleRequest")}
                </StatusChip>
                <span className="flex items-center gap-2.5">
                  <UserAvatar
                    name={appointment.patient?.name ?? "?"}
                    src={appointment.patient?.avatarUrl ?? null}
                  />
                  <span className="font-semibold">
                    {appointment.patient?.name}
                  </span>
                </span>
                <DetailList
                  items={[
                    {
                      label: t("current"),
                      value: `${format.fullDate(appointment.scheduledAt)}, ${format.time(appointment.scheduledAt)}`,
                    },
                    ...(request.type === "reschedule" && request.scheduledAt
                      ? [
                          {
                            label: t("requested"),
                            value: `${format.fullDate(request.scheduledAt)}, ${format.time(request.scheduledAt)}`,
                          },
                        ]
                      : []),
                    { label: t("reason"), value: request.reason },
                  ]}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() =>
                      setPending({ appointment, decision: "approve" })
                    }
                    className="h-10 rounded-none"
                  >
                    {t("approve")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setPending({ appointment, decision: "reject" })
                    }
                    className="h-10 rounded-none"
                  >
                    {t("reject")}
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPending(null)
            setNote("")
          }
        }}
        title={
          pending?.decision === "approve" ? t("approveTitle") : t("rejectTitle")
        }
        description={
          pending?.decision === "reject"
            ? t("rejectBody")
            : pending?.appointment.changeRequest?.type === "cancel"
              ? t("approveCancelBody")
              : t("approveRescheduleBody")
        }
        confirmLabel={
          pending?.decision === "approve" ? t("approve") : t("reject")
        }
        destructive={pending?.decision === "reject"}
        pending={isLoading}
        onConfirm={async () => {
          if (!pending) return
          try {
            await decide({
              id: pending.appointment._id,
              decision: pending.decision,
              note: note.trim() || undefined,
            }).unwrap()
            toast.success(
              pending.decision === "approve" ? t("approved") : t("rejected")
            )
            setPending(null)
            setNote("")
          } catch (caught) {
            toast.error(errorText(caught))
          }
        }}
      >
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t("decisionNote")}
          <Textarea
            value={note}
            maxLength={500}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            className="rounded-none"
          />
        </label>
      </ConfirmDialog>
    </aside>
  )
}
