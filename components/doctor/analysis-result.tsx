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
import { useApi, useCooldown } from "@/hooks/use-api"
import { errorMessage, RateLimitError } from "@/service/api-client"
import { analysisService, reviewService } from "@/service/analysis.service"
import { reportService } from "@/service/report.service"
import type { Analysis, DoctorReview, DrLevel } from "@/lib/api-types"
import { GRADE_LABELS, GRADES, isLevel } from "@/lib/grades"
import { EYE_LABELS, fmtBytes, fmtDateTime, fmtTime, userOf } from "@/lib/format"
import { cn } from "@/lib/utils"

export function AnalysisResultPage({ id }: { id: string }) {
  const cooldown = useCooldown()
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
  const eye = a.image.eye ? EYE_LABELS[a.image.eye] : "Fundus image"

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-muted-foreground">
            <Link href="/doctor/patients" className="text-primary hover:underline">
              Patients
            </Link>{" "}
            / {patient?.name ?? "Patient"} / Analysis
          </p>
          <h1 className="font-heading text-[28px] font-semibold tracking-tight sm:text-[32px]">
            {eye} · {fmtDateTime(a.createdAt)}
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/doctor/scan?patientId=${patientId}`} variant="outline">
            New scan
          </ButtonLink>
          <ButtonLink href={`/doctor/messages?with=${patientId}`} variant="outline">
            Message patient
          </ButtonLink>
        </div>
      </header>

      <div className="flex flex-wrap items-start gap-6">
        <section aria-label="Images" className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <figure className="flex flex-col gap-2.5">
              <FundusImage src={a.image.fileUrl} alt={`Fundus photograph, ${eye.toLowerCase()}`} />
              <figcaption className="text-[13px] text-muted-foreground">
                Original image
                {a.image.mimeType ? ` · ${a.image.mimeType.replace("image/", "").toUpperCase()}` : ""}
                {a.image.size ? ` · ${fmtBytes(a.image.size)}` : ""}
              </figcaption>
            </figure>
            <figure className="flex flex-col gap-2.5">
              <GradCamOverlay
                imageSrc={a.image.fileUrl}
                gradCamSrc={a.result?.gradCamUrl}
                alt="Grad-CAM heatmap over the fundus image"
              />
              <figcaption className="text-[13px] text-muted-foreground">Grad-CAM overlay</figcaption>
            </figure>
          </div>
          <Card className="p-5">
            <h2 className="mb-3 text-base font-semibold">History</h2>
            <ol className="flex flex-col gap-2 text-sm text-subtle-foreground">
              {(history.data ?? []).map((h, i) => (
                <li key={i}>
                  <span className="font-medium tabular-nums">{fmtTime(h.at)}</span> · {h.message || h.status}
                </li>
              ))}
              {a.status === "completed" && a.processingMs !== null && (
                <li className="text-muted-foreground">
                  Model {a.result?.modelVersion ?? "—"} · {(a.processingMs / 1000).toFixed(1)} s
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
                <h2 className="text-base font-semibold">AI result</h2>
                <StatusChip status={a.status} />
              </div>
              <p className="text-sm text-subtle-foreground">
                {a.status === "failed"
                  ? (a.error ?? "The AI service is not available.")
                  : "The analysis is still running. Refresh in a moment."}
              </p>
              {retryError && <Alert>{retryError}</Alert>}
              <RateLimitNotice remaining={cooldown.remaining} />
              {a.status === "failed" && (
                <Button onClick={retry} loading={retrying} disabled={cooldown.active} className="self-start">
                  Retry analysis
                </Button>
              )}
              {a.status !== "failed" && (
                <Button variant="outline" onClick={() => void analysis.reload()} className="self-start">
                  Refresh
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
  const reviews = useApi(() => reviewService.list({ analysisId: analysis.id }), [analysis.id])
  const reports = useApi(
    () => reportService.list({ patientId: typeof analysis.patient === "string" ? analysis.patient : analysis.patient.id, size: 50 }),
    [analysis.id],
  )
  if (reviews.loading && !reviews.data) return <Spinner label="Loading your review" />
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
    <form onSubmit={onSubmit} aria-label="Doctor review" className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
      <h2 className="text-base font-semibold">Your review</h2>
      {error && <Alert>{error}</Alert>}
      {saved && <Alert tone="success">Review saved.</Alert>}
      <RateLimitNotice remaining={cooldown.remaining} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">Do you agree with the AI grade?</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            [true, "Agree"],
            [false, "Change grade"],
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
      <Field label="Confirmed grade">
        {(p) => (
          <Select {...p} value={agree ? aiLevel : level} disabled={agree} onChange={(e) => setLevel(Number(e.target.value) as DrLevel)}>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g} · {GRADE_LABELS[g]}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Notes">
        {(p) => <Textarea {...p} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />}
      </Field>
      <Field label="Recommendations">
        {(p) => <Textarea {...p} rows={2} value={recommendations} onChange={(e) => setRecommendations(e.target.value)} />}
      </Field>
      <Field label="Follow-up date" optional>
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
          Save review
        </Button>
        {reportId ? (
          <ButtonLink href={`/doctor/reports/${reportId}`} variant="outline">
            Open report
          </ButtonLink>
        ) : (
          <Button variant="outline" onClick={generate} loading={generating} disabled={cooldown.active}>
            Generate report
          </Button>
        )}
      </div>
    </form>
  )
}
