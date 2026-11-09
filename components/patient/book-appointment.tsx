"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import {
  Alert,
  Avatar,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  PageTitle,
  RateLimitNotice,
  Select,
  Spinner,
  StatusChip,
} from "@/components/rc/ui"
import { useApi, useCooldown } from "@/hooks/use-api"
import { useSession } from "@/hooks/use-session"
import { ApiError, errorMessage, RateLimitError } from "@/service/api-client"
import { appointmentService, availabilityService } from "@/service/appointment.service"
import { patientService } from "@/service/patient.service"
import type { Appointment, Slot } from "@/lib/api-types"
import { doctorName, fmtDate, fmtTime, userOf } from "@/lib/format"
import { cn } from "@/lib/utils"

const DAYS_AHEAD = 14

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function BookAppointment() {
  const { me } = useSession()
  const cooldown = useCooldown()
  const doctors = useApi(me ? () => patientService.doctors(me.id) : null, [me?.id])
  const active = (doctors.data ?? []).filter((d) => d.status === "active")
  const [doctorId, setDoctorId] = useState("")
  const [changing, setChanging] = useState(false)
  const doctor = active.find((d) => d.doctor.id === doctorId)?.doctor ?? active[0]?.doctor

  const range = useMemo(() => {
    const from = new Date()
    const to = startOfDay(new Date())
    to.setDate(to.getDate() + DAYS_AHEAD)
    return { from: from.toISOString(), to: to.toISOString() }
  }, [])

  const slots = useApi(
    doctor ? () => availabilityService.list({ doctorId: doctor.id, ...range, onlyAvailable: false }) : null,
    [doctor?.id],
  )
  const mine = useApi(() => appointmentService.list({ from: new Date().toISOString(), size: 20 }), [])

  const days = useMemo(() => {
    const out: { date: Date; key: string; slots: Slot[]; free: number }[] = []
    const today = startOfDay(new Date())
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const key = date.toDateString()
      const daySlots = (slots.data ?? []).filter((s) => new Date(s.startAt).toDateString() === key)
      out.push({ date, key, slots: daySlots, free: daySlots.filter((s) => !s.isBooked).length })
    }
    return out.filter((d) => d.slots.length > 0)
  }, [slots.data])

  const [pickedDay, setDayKey] = useState<string | null>(null)
  const [slotId, setSlotId] = useState<string | null>(null)
  const [reason, setReason] = useState("")
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [booked, setBooked] = useState<{ title: string; text: string } | null>(null)

  // The picked day, or the first day with a free slot.
  const dayKey =
    pickedDay && days.some((d) => d.key === pickedDay) ? pickedDay : (days.find((d) => d.free > 0) ?? days[0])?.key ?? null

  const day = days.find((d) => d.key === dayKey)
  const slot = day?.slots.find((s) => s.id === slotId) ?? null

  async function submit() {
    if (!slot) return
    setBusy(true)
    setError(null)
    setBooked(null)
    try {
      if (rescheduling) {
        await appointmentService.reschedule(rescheduling.id, slot.id)
        setBooked({
          title: "Appointment moved.",
          text: `New time: ${fmtDate(slot.startAt)} at ${fmtTime(slot.startAt)}. ${doctorName(doctor?.name)} will confirm it.`,
        })
        setRescheduling(null)
      } else {
        await appointmentService.book({ slotId: slot.id, reason: reason.trim() || undefined })
        setBooked({
          title: "Appointment requested.",
          text: `${fmtDate(slot.startAt)} at ${fmtTime(slot.startAt)}. ${doctorName(doctor?.name)} will confirm it and you will get a notification.`,
        })
      }
      setSlotId(null)
      void slots.reload()
      void mine.reload()
    } catch (err) {
      cooldown.trip(err)
      if (err instanceof ApiError && err.statusCode === 409) {
        setError("This time slot is no longer available. Please choose another one.")
        setSlotId(null)
        void slots.reload()
      } else if (!(err instanceof RateLimitError)) setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (doctors.loading && !doctors.data) return <Spinner />

  if (!active.length) {
    return (
      <>
        <PageTitle>Book an appointment</PageTitle>
        <Card>
          <EmptyState title="You need a doctor first">
            Ask a doctor to follow you, then you can book their open times.{" "}
            <Link href="/patient/doctors" className="font-semibold text-primary hover:underline">
              Find a doctor
            </Link>
          </EmptyState>
        </Card>
        <MyAppointments list={mine.data?.items ?? []} loading={mine.loading} onChange={() => void mine.reload()} onReschedule={setRescheduling} />
      </>
    )
  }

  const timeLabel = slot ? `${fmtTime(slot.startAt)} – ${fmtTime(slot.endAt)}` : "Choose a time"
  const dayLabel = day ? day.date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "—"
  const duration = slot ? Math.round((+new Date(slot.endAt) - +new Date(slot.startAt)) / 60000) : null

  return (
    <>
      <PageTitle>{rescheduling ? "Reschedule appointment" : "Book an appointment"}</PageTitle>
      {rescheduling && (
        <Alert
          tone="info"
          action={
            <Button size="sm" variant="outline" onClick={() => setRescheduling(null)}>
              Stop
            </Button>
          }
        >
          Choose a new time for your visit on {fmtDate(rescheduling.scheduledAt)} at {fmtTime(rescheduling.scheduledAt)}.
        </Alert>
      )}
      <div className="flex flex-wrap items-start gap-6">
        <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-7 rounded-2xl border bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-semibold">Doctor</h2>
            {changing ? (
              <Field label="Choose a doctor">
                {(p) => (
                  <Select
                    {...p}
                    value={doctor?.id}
                    onChange={(e) => {
                      setDoctorId(e.target.value)
                      setChanging(false)
                      setSlotId(null)
                      setDayKey(null)
                    }}
                  >
                    {active.map(({ doctor: d }) => (
                      <option key={d.id} value={d.id}>
                        {doctorName(d.name)}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border p-3.5">
                <Avatar name={doctor!.name} src={doctor!.avatarUrl} size={44} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">{doctorName(doctor!.name)}</span>
                  <span className="truncate text-sm text-muted-foreground">
                    {[doctor!.profile?.specialty, doctor!.profile?.clinicName, doctor!.city].filter(Boolean).join(" · ")}
                  </span>
                </span>
                {active.length > 1 && (
                  <Button variant="outline" size="sm" onClick={() => setChanging(true)}>
                    Change doctor
                  </Button>
                )}
              </div>
            )}
          </div>

          {slots.loading && !slots.data ? (
            <Spinner label="Loading open times" />
          ) : days.length === 0 ? (
            <Alert tone="info">
              {doctorName(doctor?.name)} has no open times in the next two weeks. Send them a message to ask for a visit.
            </Alert>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                <h2 className="text-base font-semibold">Day</h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2.5">
                  {days.map((d) => {
                    const on = d.key === dayKey
                    const full = d.free === 0
                    return (
                      <button
                        key={d.key}
                        type="button"
                        aria-pressed={on}
                        disabled={full}
                        onClick={() => {
                          setDayKey(d.key)
                          setSlotId(null)
                          setError(null)
                          setBooked(null)
                        }}
                        className={cn(
                          "flex min-h-[72px] flex-col items-center justify-center gap-0.5 rounded-xl",
                          on
                            ? "border-2 border-primary bg-primary text-primary-foreground"
                            : full
                              ? "cursor-not-allowed border border-input bg-muted text-muted-foreground"
                              : "border border-input bg-card hover:bg-muted",
                        )}
                      >
                        <span className="text-[13px] font-medium">{d.date.toLocaleDateString("en-GB", { weekday: "short" })}</span>
                        <span className="font-heading text-xl font-semibold">{d.date.getDate()}</span>
                        <span className="text-xs">{full ? "Full" : `${d.free} free`}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h2 className="text-base font-semibold">Available times · {dayLabel}</h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2.5">
                  {day?.slots.map((s) => {
                    const on = s.id === slotId
                    return (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={on}
                        aria-disabled={s.isBooked}
                        onClick={() => {
                          setBooked(null)
                          if (s.isBooked) setError("This time slot is no longer available. Please choose another one.")
                          else {
                            setSlotId(s.id)
                            setError(null)
                          }
                        }}
                        className={cn(
                          "flex h-14 flex-col items-center justify-center rounded-[10px] text-[15px] font-semibold",
                          on
                            ? "border-2 border-primary bg-primary text-primary-foreground"
                            : s.isBooked
                              ? "cursor-not-allowed border border-input bg-muted text-muted-foreground line-through"
                              : "border border-input bg-card hover:bg-muted",
                        )}
                      >
                        {fmtTime(s.startAt)}
                        {s.isBooked && <span className="text-[11px] font-medium no-underline">Booked</span>}
                      </button>
                    )
                  })}
                </div>
                {error && <Alert>{error}</Alert>}
              </div>

              {!rescheduling && (
                <Field label="Reason for visit" optional>
                  {(p) => (
                    <Input
                      {...p}
                      value={reason}
                      maxLength={500}
                      placeholder="Follow-up after screening"
                      onChange={(e) => setReason(e.target.value)}
                    />
                  )}
                </Field>
              )}
            </>
          )}
        </section>

        <aside className="flex flex-[1_1_320px] flex-col gap-4 rounded-2xl border bg-card p-6 lg:sticky lg:top-6">
          <h2 className="text-lg font-semibold">Summary</h2>
          <dl className="flex flex-col gap-3 text-[15px]">
            {[
              ["Doctor", doctorName(doctor?.name)],
              ["Date", dayLabel],
              ["Time", timeLabel],
              ["Duration", duration ? `${duration} min` : "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <RateLimitNotice remaining={cooldown.remaining} />
          <Button size="lg" onClick={submit} loading={busy} disabled={!slot || cooldown.active}>
            {rescheduling ? "Move appointment" : "Request appointment"}
          </Button>
          {booked && (
            <Alert tone="success">
              <strong>{booked.title}</strong> {booked.text}
            </Alert>
          )}
          <p className="text-[13px] leading-snug text-muted-foreground">
            You can reschedule or cancel from your appointments. Your doctor is notified of any change.
          </p>
        </aside>
      </div>

      <MyAppointments
        list={mine.data?.items ?? []}
        loading={mine.loading}
        onChange={() => {
          void mine.reload()
          void slots.reload()
        }}
        onReschedule={(a) => {
          setRescheduling(a)
          setBooked(null)
          const docId = userOf(a.doctor)?.id ?? (typeof a.doctor === "string" ? a.doctor : "")
          if (docId) setDoctorId(docId)
          window.scrollTo({ top: 0, behavior: "smooth" })
        }}
      />
    </>
  )
}

function MyAppointments({
  list,
  loading,
  onChange,
  onReschedule,
}: {
  list: Appointment[]
  loading: boolean
  onChange: () => void
  onReschedule: (a: Appointment) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const rows = list
    .filter((a) => a.status === "pending" || a.status === "confirmed")
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))

  async function cancel(a: Appointment) {
    if (!window.confirm(`Cancel your appointment on ${fmtDate(a.scheduledAt)} at ${fmtTime(a.scheduledAt)}?`)) return
    setError(null)
    try {
      await appointmentService.cancel(a.id)
      onChange()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader title="My upcoming appointments" />
      {error && <Alert className="m-4">{error}</Alert>}
      {loading && !list.length ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState title="No upcoming appointments" />
      ) : (
        <ul>
          {rows.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-4 border-t px-5 py-4 first:border-t-0">
              <span className="flex min-w-[200px] flex-1 flex-col">
                <span className="font-semibold">
                  {fmtDate(a.scheduledAt)}, {fmtTime(a.scheduledAt)} – {fmtTime(a.endAt)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {doctorName(userOf(a.doctor)?.name)}
                  {a.reason ? ` · ${a.reason}` : ""}
                </span>
              </span>
              <StatusChip status={a.status} label={a.status === "pending" ? "Waiting for doctor" : "Confirmed"} />
              <span className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onReschedule(a)}>
                  Reschedule
                </Button>
                <Button size="sm" variant="danger" onClick={() => cancel(a)}>
                  Cancel
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
