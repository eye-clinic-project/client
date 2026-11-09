"use client"

import { useMemo, useState, type FormEvent } from "react"
import { Trash2 } from "lucide-react"

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
import { errorMessage, RateLimitError } from "@/service/api-client"
import { appointmentService, availabilityService } from "@/service/appointment.service"
import type { Appointment, Slot } from "@/lib/api-types"
import { fmtLongDay, fmtTime, userOf } from "@/lib/format"
import { cn } from "@/lib/utils"

function groupByDay<T>(items: T[], at: (item: T) => string) {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = new Date(at(item)).toDateString()
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  return [...groups.entries()]
}

export function DoctorAppointments() {
  const { me } = useSession()
  const [view, setView] = useState<"upcoming" | "past">("upcoming")
  const nowIso = useMemo(() => new Date().toISOString(), [])
  const list = useApi(
    () => appointmentService.list(view === "upcoming" ? { from: nowIso, size: 100 } : { to: nowIso, size: 100 }),
    [view],
  )
  const slots = useApi(
    me ? () => availabilityService.list({ doctorId: me.id, from: nowIso }) : null,
    [me?.id],
  )
  const items = useMemo(() => {
    const rows = [...(list.data?.items ?? [])]
    rows.sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))
    return view === "past" ? rows.reverse() : rows
  }, [list.data, view])

  return (
    <>
      <PageTitle>Appointments</PageTitle>
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          <div role="tablist" aria-label="Appointments" className="flex w-fit gap-1 rounded-xl bg-muted p-1">
            {(["upcoming", "past"] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={view === key}
                onClick={() => setView(key)}
                className={cn(
                  "h-10 rounded-[9px] px-4 text-sm font-semibold capitalize",
                  view === key ? "bg-card shadow-sm" : "text-subtle-foreground hover:text-foreground",
                )}
              >
                {key}
              </button>
            ))}
          </div>
          {list.error ? <Alert>{errorMessage(list.error)}</Alert> : null}
          {list.loading && !list.data ? (
            <Spinner />
          ) : items.length === 0 ? (
            <Card>
              <EmptyState title={view === "upcoming" ? "No upcoming appointments" : "No past appointments"}>
                {view === "upcoming" && "Open time slots so patients can book a visit."}
              </EmptyState>
            </Card>
          ) : (
            groupByDay(items, (a) => a.scheduledAt).map(([day, rows]) => (
              <Card key={day} className="overflow-hidden">
                <CardHeader title={fmtLongDay(rows[0]!.scheduledAt)} />
                <ul>
                  {rows.map((a) => (
                    <AppointmentRow
                      key={a.id}
                      appointment={a}
                      onChange={(next) => {
                        list.setData((prev) => ({ ...prev!, items: prev!.items.map((x) => (x.id === next.id ? next : x)) }))
                        void slots.reload()
                      }}
                    />
                  ))}
                </ul>
              </Card>
            ))
          )}
        </div>

        <aside className="flex flex-[1_1_340px] flex-col gap-5">
          <OpenSlots onCreated={() => void slots.reload()} />
          <Card className="overflow-hidden">
            <CardHeader title="Your open slots" />
            {slots.loading && !slots.data ? (
              <Spinner />
            ) : (
              <SlotList slots={(slots.data ?? []).filter((s) => !s.isBooked)} onRemoved={() => void slots.reload()} />
            )}
          </Card>
        </aside>
      </div>
    </>
  )
}

function AppointmentRow({ appointment: a, onChange }: { appointment: Appointment; onChange: (a: Appointment) => void }) {
  const patient = userOf(a.patient)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const started = new Date(a.scheduledAt) <= new Date()

  async function act(kind: "confirm" | "complete" | "cancel") {
    if (kind === "cancel" && !window.confirm(`Cancel the appointment with ${patient?.name ?? "this patient"}?`)) return
    setBusy(kind)
    setError(null)
    try {
      const next =
        kind === "confirm"
          ? await appointmentService.confirm(a.id)
          : kind === "complete"
            ? await appointmentService.complete(a.id)
            : await appointmentService.cancel(a.id)
      onChange({ ...a, ...next })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const open = a.status === "pending" || a.status === "confirmed"
  return (
    <li className="flex flex-wrap items-center gap-4 border-t px-5 py-4 first:border-t-0">
      <span className="w-[104px] shrink-0 font-heading text-base font-semibold">
        {fmtTime(a.scheduledAt)} – {fmtTime(a.endAt)}
      </span>
      <Avatar name={patient?.name ?? "?"} size={36} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-semibold">{patient?.name ?? "Patient"}</span>
        <span className="truncate text-[13px] text-muted-foreground">{a.reason || "Appointment"}</span>
        {a.cancelReason && <span className="text-[13px] text-muted-foreground">Reason: {a.cancelReason}</span>}
      </span>
      <StatusChip status={a.status} />
      {open && (
        <span className="flex gap-2">
          {a.status === "pending" && (
            <Button size="sm" loading={busy === "confirm"} disabled={!!busy} onClick={() => act("confirm")}>
              Confirm
            </Button>
          )}
          {a.status === "confirmed" && started && (
            <Button size="sm" loading={busy === "complete"} disabled={!!busy} onClick={() => act("complete")}>
              Complete
            </Button>
          )}
          <Button size="sm" variant="danger" loading={busy === "cancel"} disabled={!!busy} onClick={() => act("cancel")}>
            Cancel
          </Button>
        </span>
      )}
      {error && <Alert className="w-full">{error}</Alert>}
    </li>
  )
}

function OpenSlots({ onCreated }: { onCreated: () => void }) {
  const cooldown = useCooldown()
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [start, setStart] = useState("09:00")
  const [end, setEnd] = useState("13:00")
  const [minutes, setMinutes] = useState(30)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setDone(null)
    const startAt = new Date(`${date}T${start}`)
    const endAt = new Date(`${date}T${end}`)
    if (!(endAt > startAt)) return setError("The end time must be after the start time.")
    if (startAt <= new Date()) return setError("Choose a time in the future.")
    setBusy(true)
    try {
      const created = await availabilityService.create({
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        slotMinutes: minutes,
      })
      setDone(`${created.length} slot${created.length === 1 ? "" : "s"} opened on ${fmtLongDay(startAt)}.`)
      onCreated()
    } catch (err) {
      cooldown.trip(err)
      if (!(err instanceof RateLimitError)) setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
      <h2 className="text-lg font-semibold">Open time slots</h2>
      <p className="-mt-2 text-sm text-muted-foreground">Patients can book any open slot. You confirm each request.</p>
      {error && <Alert>{error}</Alert>}
      {done && <Alert tone="success">{done}</Alert>}
      <RateLimitNotice remaining={cooldown.remaining} />
      <Field label="Day">
        {(p) => <Input {...p} type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="From">
          {(p) => <Input {...p} type="time" step={900} value={start} onChange={(e) => setStart(e.target.value)} />}
        </Field>
        <Field label="To">
          {(p) => <Input {...p} type="time" step={900} value={end} onChange={(e) => setEnd(e.target.value)} />}
        </Field>
      </div>
      <Field label="Visit length">
        {(p) => (
          <Select {...p} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
            {[15, 20, 30, 45, 60].map((m) => (
              <option key={m} value={m}>
                {m} minutes
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Button type="submit" loading={busy} disabled={cooldown.active}>
        Open slots
      </Button>
    </form>
  )
}

function SlotList({ slots, onRemoved }: { slots: Slot[]; onRemoved: () => void }) {
  const [error, setError] = useState<string | null>(null)
  if (!slots.length) return <EmptyState title="No open slots" />
  async function remove(id: string) {
    setError(null)
    try {
      await availabilityService.remove(id)
      onRemoved()
    } catch (err) {
      setError(errorMessage(err))
    }
  }
  return (
    <>
      {error && <Alert className="m-4">{error}</Alert>}
      <ul className="max-h-[420px] overflow-y-auto">
        {groupByDay(slots, (s) => s.startAt).map(([day, rows]) => (
          <li key={day} className="border-t px-5 py-3 first:border-t-0">
            <p className="mb-2 text-sm font-semibold">{fmtLongDay(rows[0]!.startAt)}</p>
            <div className="flex flex-wrap gap-2">
              {rows.map((s) => (
                <span key={s.id} className="inline-flex items-center gap-1 rounded-[9px] border border-input py-1 pr-1 pl-3 text-sm">
                  {fmtTime(s.startAt)}
                  <button
                    type="button"
                    aria-label={`Remove slot at ${fmtTime(s.startAt)}`}
                    onClick={() => remove(s.id)}
                    className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
