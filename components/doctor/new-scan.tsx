"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react"
import { Check, ImageUp, Loader2, X } from "lucide-react"

import {
  Alert,
  Avatar,
  Button,
  Card,
  Checkbox,
  ChoiceCard,
  Field,
  RateLimitNotice,
  Textarea,
  controlClass,
} from "@/components/rc/ui"
import { useI18n } from "@/components/i18n-provider"
import { useApi, useCooldown } from "@/hooks/use-api"
import { errorMessage, RateLimitError } from "@/service/api-client"
import { analysisService, imageService } from "@/service/analysis.service"
import { patientService } from "@/service/patient.service"
import type { Analysis, EyeSide, PatientListItem, PatientRecord } from "@/lib/api-types"
import { ageFrom, diabetesLabel, fmtBytes, fmtTime, userOf } from "@/lib/format"
import { cn } from "@/lib/utils"

const MAX_BYTES = 10 * 1024 * 1024
const TYPES = ["image/jpeg", "image/png"]

type Phase = "idle" | "uploading" | "analysing" | "done" | "failed" | "saved"

export function NewScanPage() {
  const params = useSearchParams()
  const router = useRouter()
  const cooldown = useCooldown()
  const { t } = useI18n()
  const s = t.scan
  const [patientId, setPatientId] = useState(params.get("patientId") ?? "")
  const [eye, setEye] = useState<EyeSide>("left")
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [analyze, setAnalyze] = useState(true)
  const [phase, setPhase] = useState<Phase>("idle")
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [imageId, setImageId] = useState<string | null>(null)

  const patient = useApi(patientId ? () => patientService.getById(patientId) : null, [patientId])
  const failed = useApi(
    params.get("failed") ? () => analysisService.list({ status: "failed", size: 10 }) : null,
    [params.get("failed")],
  )

  function pick(next: File | undefined | null) {
    setFileError(null)
    if (!next) return
    if (!TYPES.includes(next.type)) {
      setFile(null)
      setFileError(s.wrongType(next.name))
      return
    }
    if (next.size > MAX_BYTES) {
      setFile(null)
      setFileError(s.tooBig(next.name, fmtBytes(next.size)))
      return
    }
    setFile(next)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!patientId) return setError(s.choosePatient)
    if (!file) return setFileError(s.chooseImage)
    setPhase(analyze ? "analysing" : "uploading")
    setAnalysis(null)
    try {
      const res = await imageService.upload({ file, patientId, eye, notes: notes.trim() || undefined, analyze })
      setImageId(res.image.id)
      if (!res.analysis) {
        setPhase("saved")
        return
      }
      setAnalysis(res.analysis)
      if (res.analysis.status === "completed") {
        setPhase("done")
        router.push(`/doctor/analyses/${res.analysis.id}`)
      } else {
        setPhase("failed")
      }
    } catch (err) {
      cooldown.trip(err)
      setPhase("idle")
      if (!(err instanceof RateLimitError)) setError(errorMessage(err))
    }
  }

  async function retry(target: Analysis) {
    setError(null)
    setPhase("analysing")
    try {
      const next = await analysisService.retry(target.id)
      setAnalysis(next)
      if (next.status === "completed") {
        setPhase("done")
        router.push(`/doctor/analyses/${next.id}`)
      } else setPhase("failed")
    } catch (err) {
      cooldown.trip(err)
      setPhase("failed")
      if (!(err instanceof RateLimitError)) setError(errorMessage(err))
    }
  }

  async function runSaved() {
    if (!imageId) return
    setError(null)
    setPhase("analysing")
    try {
      const created = await analysisService.create(imageId)
      const next = await analysisService.predict(created.id)
      setAnalysis(next)
      if (next.status === "completed") router.push(`/doctor/analyses/${next.id}`)
      else setPhase("failed")
    } catch (err) {
      cooldown.trip(err)
      setPhase("saved")
      if (!(err instanceof RateLimitError)) setError(errorMessage(err))
    }
  }

  const busy = phase === "uploading" || phase === "analysing"
  const p = patient.data

  return (
    <>
      <header className="flex flex-col gap-1.5">
        <p className="text-sm text-muted-foreground">
          <Link href="/doctor/patients" className="text-primary hover:underline">
            {t.nav.patients}
          </Link>
          {p ? ` / ${p.name}` : ""}
        </p>
        <h1 className="font-heading text-[28px] font-semibold tracking-tight sm:text-[32px]">{s.title}</h1>
      </header>

      {failed.data && failed.data.items.length > 0 && (
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="text-[17px] font-semibold">{s.failedTitle}</h2>
          <ul className="flex flex-col divide-y">
            {failed.data.items.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="flex-1">
                  <span className="font-semibold">{userOf(a.patient)?.name ?? t.common.patient}</span>
                  <span className="block text-[13px] text-muted-foreground">{a.error ?? s.failedDefault}</span>
                </span>
                <Button size="sm" variant="outline" disabled={busy || cooldown.active} onClick={() => retry(a)}>
                  {t.common.retry}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex flex-wrap items-start gap-6">
        <form onSubmit={onSubmit} noValidate className="flex min-w-0 flex-[999_1_560px] flex-col gap-6 rounded-2xl border bg-card p-6 sm:p-8">
          {error && <Alert>{error}</Alert>}
          <RateLimitNotice remaining={cooldown.remaining} />

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">{s.patient}</span>
            {p ? (
              <PatientCard patient={p} onChange={() => setPatientId("")} />
            ) : (
              <PatientPicker onPick={(id) => setPatientId(id)} />
            )}
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-sm font-semibold">{s.eye}</legend>
            <div className="grid grid-cols-3 gap-3">
              {(["left", "right", "unknown"] as const).map((side) => (
                <ChoiceCard
                  key={side}
                  name="eye"
                  value={side}
                  checked={eye === side}
                  onChange={() => setEye(side)}
                  title={t.eyeShort[side]}
                  className="items-center p-3.5"
                />
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">{s.image}</span>
            <DropZone onFile={pick} disabled={busy} />
            {file && (
              <div className="flex items-center gap-3 rounded-xl border p-3.5">
                <ImageUp className="size-5 text-primary" aria-hidden="true" />
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="flex justify-between gap-3 text-sm">
                    <span className="truncate font-semibold">{file.name}</span>
                    <span className="shrink-0 text-muted-foreground">{fmtBytes(file.size)}</span>
                  </span>
                  {busy && (
                    <span
                      role="progressbar"
                      aria-label={s.progress}
                      className="h-1.5 overflow-hidden rounded-full bg-muted"
                    >
                      <span className="block h-full w-1/3 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
                    </span>
                  )}
                </span>
                {!busy && (
                  <button
                    type="button"
                    aria-label={s.remove}
                    onClick={() => setFile(null)}
                    className="flex size-10 items-center justify-center rounded-[9px] hover:bg-muted"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            )}
            {fileError && <Alert>{fileError}</Alert>}
          </div>

          <Field label={s.notes} optional>
            {(f) => <Textarea {...f} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />}
          </Field>
          <Checkbox checked={analyze} onChange={(e) => setAnalyze(e.target.checked)}>
            {s.runAi}
          </Checkbox>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="lg" loading={busy} disabled={cooldown.active}>
              {analyze ? s.uploadAnalyse : s.upload}
            </Button>
          </div>
        </form>

        <aside aria-label={s.statusLabel} className="flex flex-[1_1_320px] flex-col gap-4">
          <Card className="p-6">
            <h2 className="mb-4 text-base font-semibold">{s.pipeline}</h2>
            <ol className="flex flex-col gap-4">
              {s.steps.map(([title, detail], i) => {
                const state =
                  phase === "done"
                    ? "done"
                    : phase === "failed"
                      ? i === 0
                        ? "done"
                        : i === 1
                          ? "failed"
                          : "todo"
                      : phase === "saved"
                        ? i === 0
                          ? "done"
                          : "todo"
                        : busy
                          ? i === 0 && phase === "uploading"
                            ? "active"
                            : phase === "analysing"
                              ? "active"
                              : "todo"
                          : "todo"
                return (
                  <li key={title} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                        state === "done" && "border-primary bg-primary text-primary-foreground",
                        state === "active" && "border-primary text-primary",
                        state === "failed" && "border-destructive bg-danger-bg text-destructive",
                        state === "todo" && "border-input",
                      )}
                    >
                      {state === "done" && <Check className="size-3.5" strokeWidth={3} />}
                      {state === "active" && <Loader2 className="size-3.5 animate-spin" />}
                      {state === "failed" && <X className="size-3.5" strokeWidth={3} />}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-[15px] font-semibold">{title}</span>
                      <span className="text-[13px] text-muted-foreground">{detail}</span>
                    </span>
                  </li>
                )
              })}
            </ol>
          </Card>

          {phase === "failed" && analysis && (
            <section role="status" className="flex flex-col gap-3 rounded-2xl bg-warning-bg p-5 text-warning-fg">
              <h2 className="text-base font-semibold">{s.didNotFinish}</h2>
              <p className="text-sm leading-relaxed">
                {s.savedTo(p?.name ?? s.theFallback)} {analysis.error ?? s.aiUnavailable}{" "}
                {s.attemptFailed(analysis.attempts, fmtTime(analysis.updatedAt))}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="sm" onClick={() => retry(analysis)} disabled={cooldown.active}>
                  {s.retryAnalysis}
                </Button>
                <Link href={`/doctor/analyses/${analysis.id}`} className="self-center text-sm font-semibold underline">
                  {s.openAnalysis}
                </Link>
              </div>
            </section>
          )}
          {phase === "saved" && (
            <Alert tone="success" action={<Button size="sm" onClick={runSaved} disabled={cooldown.active}>{s.runAnalysis}</Button>}>
              {s.imageSaved}
            </Alert>
          )}
          <p className="text-[13px] leading-snug text-muted-foreground">
            {s.target}
          </p>
        </aside>
      </div>
    </>
  )
}

function PatientCard({ patient, onChange }: { patient: PatientRecord; onChange: () => void }) {
  const { t } = useI18n()
  const age = ageFrom(patient.profile?.dateOfBirth)
  const dm = patient.profile?.diabetesType
  const meta = [
    patient.profile?.medicalRecordNumber,
    age !== null ? t.patients.years(age) : null,
    dm ? t.scan.diabetesLabel(diabetesLabel(dm)) : null,
  ].filter(Boolean)
  return (
    <div className="flex items-center gap-3 rounded-xl border p-3.5">
      <Avatar name={patient.name} src={patient.avatarUrl} size={40} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-semibold">{patient.name}</span>
        <span className="truncate text-[13px] text-muted-foreground">{meta.join(" · ")}</span>
      </span>
      <Button variant="outline" size="sm" onClick={onChange}>
        {t.scan.change}
      </Button>
    </div>
  )
}

function PatientPicker({ onPick }: { onPick: (id: string) => void }) {
  const { t } = useI18n()
  const [q, setQ] = useState("")
  const [term, setTerm] = useState("")
  useEffect(() => {
    const t = window.setTimeout(() => setTerm(q.trim()), 250)
    return () => window.clearTimeout(t)
  }, [q])
  const { data, loading } = useApi(() => patientService.search({ search: term || undefined, size: 6 }), [term])
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="pick-patient" className="sr-only">
        {t.scan.searchLabel}
      </label>
      <input
        id="pick-patient"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t.scan.searchPlaceholder}
        className={controlClass}
      />
      <ul className="flex flex-col overflow-hidden rounded-xl border">
        {loading && !data && <li className="px-4 py-3 text-sm text-muted-foreground">{t.scan.searching}</li>}
        {data?.items.length === 0 && (
          <li className="px-4 py-3 text-sm text-muted-foreground">
            {t.scan.noneFound}{" "}
            <Link href="/doctor/patients?add=1" className="font-semibold text-primary hover:underline">
              {t.scan.addPatient}
            </Link>
          </li>
        )}
        {data?.items.map((p: PatientListItem) => (
          <li key={p.id} className="border-t first:border-t-0">
            <button
              type="button"
              onClick={() => onPick(p.id)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-start hover:bg-muted"
            >
              <Avatar name={p.name} size={32} />
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold">{p.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {p.profile?.medicalRecordNumber} · {p.email}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DropZone({ onFile, disabled }: { onFile: (f: File | undefined) => void; disabled?: boolean }) {
  const [over, setOver] = useState(false)
  const { t } = useI18n()
  const input = useRef<HTMLInputElement>(null)
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    if (!disabled) onFile(e.dataTransfer.files[0])
  }
  return (
    <label
      htmlFor="fundus-file"
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-6 py-9 text-center transition-colors",
        over ? "border-primary bg-accent" : "border-input hover:bg-muted/50",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <ImageUp className="mb-1 size-7 text-primary" aria-hidden="true" />
      <span className="text-[15px] font-semibold">
        {t.scan.drop} <span className="text-primary underline">{t.scan.browse}</span>
      </span>
      <span className="text-[13px] text-muted-foreground">{t.scan.types}</span>
      <input
        ref={input}
        id="fundus-file"
        type="file"
        accept="image/jpeg,image/png"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          onFile(e.target.files?.[0])
          e.target.value = ""
        }}
      />
    </label>
  )
}
