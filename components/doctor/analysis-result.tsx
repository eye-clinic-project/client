"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

import { AiResultCard } from "@/components/analysis/ai-result-card"
import { FundusImage, GradCamOverlay } from "@/components/rc/fundus"
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  Field,
  Input,
  RateLimitNotice,
  Select,
  Spinner,
  StatusChip,
  Textarea,
} from "@/components/rc/ui"
import { useI18n } from "@/components/i18n-provider"
import { useApi, useCooldown } from "@/hooks/use-api"
import { errorMessage, RateLimitError } from "@/service/api-client"
import { analysisService, reviewService } from "@/service/analysis.service"
import { reportService } from "@/service/report.service"
import type { Analysis, DoctorReview, DrLevel } from "@/lib/api-types"
import { GRADES, isLevel } from "@/lib/grades"
import { eyeLabel, fmtBytes, fmtDateTime, fmtTime, userOf } from "@/lib/format"
import { cn } from "@/lib/utils"

export function AnalysisResultPage({ id }: { id: string }) {
  const cooldown = useCooldown()
  const { t } = useI18n()
  const L = t.analysis
  const analysis = useApi(() => analysisService.getById(id), [id])
  const history = useApi(() => analysisService.history(id), [id])
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)

  async function retry() {
    setRetrying(true)
    setRetryError(null)
    try {
      analysis.setData(await analysisService.retry(id))
      void history.reload()
    } catch (err) {
      cooldown.trip(err)
      if (!(err instanceof RateLimitError)) setRetryError(errorMessage(err))
    } finally {
      setRetrying(false)
    }
  }

  if (analysis.error) return <Alert>{errorMessage(analysis.error)}</Alert>
  const a = analysis.data
  if (!a) return <Spinner />

  const patient = userOf(a.patient)
  const patientId = patient?.id ?? (typeof a.patient === "string" ? a.patient : "")
  const eye = a.image.eye ? eyeLabel(a.image.eye) : t.scan.image

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-muted-foreground">
            <Link href="/doctor/patients" className="text-primary hover:underline">
              {t.nav.patients}
            </Link>{" "}
            / {patient?.name ?? t.common.patient} / {L.crumb}
          </p>
          <h1 className="font-heading text-[28px] font-semibold tracking-tight sm:text-[32px]">
            {eye} · {fmtDateTime(a.createdAt)}
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/doctor/scan?patientId=${patientId}`} variant="outline">
            {L.newScan}
          </ButtonLink>
          <ButtonLink href={`/doctor/messages?with=${patientId}`} variant="outline">
            {L.messagePatient}
          </ButtonLink>
        </div>
      </header>

      <div className="flex flex-wrap items-start gap-6">
        <section aria-label={L.images} className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <figure className="flex flex-col gap-2.5">
              <FundusImage src={a.image.fileUrl} alt={L.photoAlt(eye)} />
              <figcaption className="text-[13px] text-muted-foreground">
                {L.original}
                {a.image.mimeType ? ` · ${a.image.mimeType.replace("image/", "").toUpperCase()}` : ""}
                {a.image.size ? ` · ${fmtBytes(a.image.size)}` : ""}
              </figcaption>
            </figure>
            <figure className="flex flex-col gap-2.5">
              <GradCamOverlay
                imageSrc={a.image.fileUrl}
                gradCamSrc={a.result?.gradCamUrl}
                alt={L.overlayAlt}
              />
              <figcaption className="text-[13px] text-muted-foreground">{L.overlay}</figcaption>
            </figure>
          </div>
          <Card className="p-5">
            <h2 className="mb-3 text-base font-semibold">{L.history}</h2>
            <ol className="flex flex-col gap-2 text-sm text-subtle-foreground">
              {(history.data ?? []).map((h, i) => (
                <li key={i}>
                  <span className="font-medium tabular-nums">{fmtTime(h.at)}</span> · {h.message || h.status}
                </li>
              ))}
              {a.status === "completed" && a.processingMs !== null && (
                <li className="text-muted-foreground">
                  {L.model(a.result?.modelVersion ?? "—", (a.processingMs / 1000).toFixed(1))}
                </li>
              )}
            </ol>
          </Card>
        </section>

        <aside className="flex flex-[1_1_380px] flex-col gap-5">
          {a.status === "completed" ? (
            <>
              <AiResultCard analysis={a} />
              <ReviewForm analysis={a} />
            </>
          ) : (
            <Card className="flex flex-col gap-3 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">{L.aiResult}</h2>
                <StatusChip status={a.status} />
              </div>
              <p className="text-sm text-subtle-foreground">
                {a.status === "failed"
                  ? (a.error ?? t.scan.aiUnavailable)
                  : L.stillRunning}
              </p>
              {retryError && <Alert>{retryError}</Alert>}
              <RateLimitNotice remaining={cooldown.remaining} />
              {a.status === "failed" && (
                <Button onClick={retry} loading={retrying} disabled={cooldown.active} className="self-start">
                  {t.scan.retryAnalysis}
                </Button>
              )}
              {a.status !== "failed" && (
                <Button variant="outline" onClick={() => void analysis.reload()} className="self-start">
                  {t.common.refresh}
                </Button>
              )}
            </Card>
          )}
        </aside>
      </div>
    </>
  )
}

function ReviewForm({ analysis }: { analysis: Analysis }) {
  const { t } = useI18n()
  const reviews = useApi(() => reviewService.list({ analysisId: analysis.id }), [analysis.id])
  const reports = useApi(
    () => reportService.list({ patientId: typeof analysis.patient === "string" ? analysis.patient : analysis.patient.id, size: 50 }),
    [analysis.id],
  )
  if (reviews.loading && !reviews.data) return <Spinner label={t.analysis.loadingReview} />
  const existing = reviews.data?.items[0] ?? null
  return (
    <ReviewFields
      key={existing?.id ?? "new"}
      analysis={analysis}
      initial={existing}
      reportId={reports.data?.items.find((r) => r.analysis === analysis.id)?.id}
    />
  )
}

function ReviewFields({
  analysis,
  initial,
  reportId,
}: {
  analysis: Analysis
  initial: DoctorReview | null
  reportId?: string
}) {
  const router = useRouter()
  const cooldown = useCooldown()
  const { t } = useI18n()
  const L = t.analysis
  const aiLevel = analysis.result!.predictedLevel as DrLevel
  const [review, setReview] = useState<DoctorReview | null>(initial)
  const [agree, setAgree] = useState(initial?.aiResultConfirmed ?? true)
  const [level, setLevel] = useState<DrLevel>(initial && isLevel(initial.confirmedLevel) ? initial.confirmedLevel : aiLevel)
  const [notes, setNotes] = useState(initial?.notes ?? "")
  const [recommendations, setRecommendations] = useState(initial?.recommendations ?? "")
  const [followUp, setFollowUp] = useState(initial?.followUpDate ? initial.followUpDate.slice(0, 10) : "")
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function save(): Promise<boolean> {
    setError(null)
    setSaved(false)
    const dto = {
      analysisId: analysis.id,
      aiResultConfirmed: agree,
      confirmedLevel: agree ? aiLevel : level,
      notes: notes.trim() || undefined,
      recommendations: recommendations.trim() || undefined,
      followUpDate: followUp || undefined,
    }
    try {
      const next = review ? await reviewService.update(review.id, dto) : await reviewService.create(dto)
      setReview(next)
      setSaved(true)
      return true
    } catch (err) {
      cooldown.trip(err)
      if (!(err instanceof RateLimitError)) setError(errorMessage(err))
      return false
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    await save()
    setSaving(false)
  }

  async function generate() {
    setGenerating(true)
    try {
      if (!(await save())) return
      const report = await reportService.create({ analysisId: analysis.id })
      router.push(`/doctor/reports/${report.id}`)
    } catch (err) {
      cooldown.trip(err)
      if (!(err instanceof RateLimitError)) setError(errorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <form onSubmit={onSubmit} aria-label={L.reviewLabel} className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
      <h2 className="text-base font-semibold">{L.review}</h2>
      {error && <Alert>{error}</Alert>}
      {saved && <Alert tone="success">{L.reviewSaved}</Alert>}
      <RateLimitNotice remaining={cooldown.remaining} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">{L.agreeQuestion}</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            [true, L.agree],
            [false, L.changeGrade],
          ].map(([value, label]) => (
            <label
              key={String(value)}
              className={cn(
                "flex h-11 cursor-pointer items-center gap-2.5 rounded-[10px] px-3 text-[15px] font-medium",
                agree === value ? "border-2 border-primary bg-accent" : "border border-input",
              )}
            >
              <input
                type="radio"
                name="agree"
                checked={agree === value}
                onChange={() => {
                  setAgree(value as boolean)
                  if (value) setLevel(aiLevel)
                }}
                className="size-4 accent-primary"
              />
              {label as string}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label={L.confirmedGrade}>
        {(p) => (
          <Select {...p} value={agree ? aiLevel : level} disabled={agree} onChange={(e) => setLevel(Number(e.target.value) as DrLevel)}>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g} · {t.grades.short[g]}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label={L.notes}>
        {(p) => <Textarea {...p} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />}
      </Field>
      <Field label={L.recommendations}>
        {(p) => <Textarea {...p} rows={2} value={recommendations} onChange={(e) => setRecommendations(e.target.value)} />}
      </Field>
      <Field label={L.followUp} optional>
        {(p) => (
          <Input
            {...p}
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
          />
        )}
      </Field>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={saving} disabled={cooldown.active}>
          {L.saveReview}
        </Button>
        {reportId ? (
          <ButtonLink href={`/doctor/reports/${reportId}`} variant="outline">
            {L.openReport}
          </ButtonLink>
        ) : (
          <Button variant="outline" onClick={generate} loading={generating} disabled={cooldown.active}>
            {L.generateReport}
          </Button>
        )}
      </div>
    </form>
  )
}
