"use client"

import Link from "next/link"
import { useState } from "react"
import { Download, Send } from "lucide-react"

import { FundusImage, GradCamOverlay } from "@/components/rc/fundus"
import { Alert, Button, Field, Logo, RateLimitNotice, Spinner, StatusChip, Textarea } from "@/components/rc/ui"
import { useI18n } from "@/components/i18n-provider"
import { useApi, useCooldown } from "@/hooks/use-api"
import { errorMessage, RateLimitError } from "@/service/api-client"
import { reportService } from "@/service/report.service"
import type { DrLevel, Report } from "@/lib/api-types"
import { GRADE_TEXT, isLevel } from "@/lib/grades"
import { diabetesLabel, doctorName, eyeLabel, fmtDate, pct, userOf } from "@/lib/format"
import { cn } from "@/lib/utils"

export function ReportPage({ id, role }: { id: string; role: "doctor" | "patient" }) {
  const { data, error, setData } = useApi(() => reportService.getById(id), [id])
  if (error) return <Alert>{errorMessage(error)}</Alert>
  if (!data) return <Spinner />
  return <ReportView report={data} role={role} onChange={setData} />
}

function ReportView({ report, role, onChange }: { report: Report; role: "doctor" | "patient"; onChange: (r: Report) => void }) {
  const cooldown = useCooldown()
  const { t } = useI18n()
  const R = t.report
  const [busy, setBusy] = useState<"pdf" | "send" | "save" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [content, setContent] = useState(report.content)
  const [recommendations, setRecommendations] = useState(report.recommendations)

  const patient = userOf(report.patient)
  const doctor = userOf(report.doctor)
  const a = report.analysis
  const r = a.result
  const level: DrLevel | null = report.review?.confirmedLevel ?? (isLevel(r?.predictedLevel) ? r!.predictedLevel : null)
  const eye = a.image.eye ? eyeLabel(a.image.eye) : R.eyeFallback
  const editable = role === "doctor" && report.status === "draft"
  const dirty = content !== report.content || recommendations !== report.recommendations

  async function act(kind: "pdf" | "send" | "save") {
    setBusy(kind)
    setError(null)
    setNotice(null)
    try {
      if (kind === "pdf") await reportService.downloadPdf(report)
      if (kind === "save") {
        onChange(await reportService.update(report.id, { content, recommendations }))
        setNotice(R.saved)
      }
      if (kind === "send") {
        if (dirty) await reportService.update(report.id, { content, recommendations })
        onChange(await reportService.send(report.id))
        setNotice(R.sentTo(patient?.name ?? t.scan.theFallback))
      }
    } catch (err) {
      cooldown.trip(err)
      if (!(err instanceof RateLimitError)) setError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const patientProfile = report.patientProfile
  const doctorProfile = report.doctorProfile

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <Link href={role === "doctor" ? "/doctor/reports" : "/patient/reports"} className="text-primary hover:underline">
            {R.reports}
          </Link>{" "}
          / {fmtDate(report.createdAt)}
        </p>
        <div className="flex flex-wrap gap-3">
          {role === "doctor" && report.status === "draft" && (
            <Button onClick={() => act("send")} loading={busy === "send"} disabled={cooldown.active}>
              <Send className="size-4 rtl:-scale-x-100" aria-hidden="true" /> {R.send}
            </Button>
          )}
          <Button variant="outline" onClick={() => act("pdf")} loading={busy === "pdf"} disabled={cooldown.active}>
            <Download className="size-4" aria-hidden="true" /> {R.download}
          </Button>
        </div>
      </div>
      {error && <Alert>{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}
      <RateLimitNotice remaining={cooldown.remaining} />

      <article className="mx-auto flex w-full max-w-[880px] flex-col gap-7 rounded-2xl border bg-card p-6 sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
          <div className="flex flex-col gap-3">
            <Logo />
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-[28px]">{report.title}</h1>
          </div>
          <div className="flex flex-col items-end gap-2 text-sm text-muted-foreground">
            {role === "doctor" && <StatusChip status={report.status} />}
            {report.sentAt && <span>{R.sentOn(fmtDate(report.sentAt))}</span>}
          </div>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          <InfoBlock
            title={R.patient}
            rows={[
              [R.name, patient?.name],
              [R.patientId, patientProfile?.medicalRecordNumber],
              [R.dob, patientProfile?.dateOfBirth ? fmtDate(patientProfile.dateOfBirth) : undefined],
              [R.sex, patientProfile?.gender ? t.sex[patientProfile.gender] : undefined],
              [R.diabetes, patientProfile?.diabetesType ? diabetesLabel(patientProfile.diabetesType) : undefined],
            ]}
          />
          <InfoBlock
            title={R.doctor}
            rows={[
              [R.name, doctorName(doctor?.name)],
              [R.clinic, doctorProfile?.clinicName],
              [R.specialty, doctorProfile?.specialty],
            ]}
          />
        </div>

        <section className="flex flex-col gap-4 rounded-2xl bg-muted p-5 sm:p-6">
          <h2 className="text-base font-semibold">{R.result}</h2>
          <div className="flex flex-wrap gap-6">
            <div className="flex min-w-[220px] flex-1 flex-col gap-1">
              <span className="text-sm text-muted-foreground">
                {report.review ? R.confirmedGrade(eye) : R.aiGrade(eye)}
              </span>
              <span className={cn("font-heading text-[30px] leading-tight font-semibold", level !== null && GRADE_TEXT[level])}>
                {level === null ? "—" : t.grades.dr[level]}
              </span>
              {level !== null && (
                <span className="text-sm text-subtle-foreground">
                  {t.grades.gradeOf(level)} ·{" "}
                  {report.review
                    ? report.review.aiResultConfirmed
                      ? R.aiConfirmed
                      : R.changedByDoctor
                    : R.notReviewed}
                </span>
              )}
            </div>
            <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">{R.screeningDate}</dt>
              <dd className="font-medium">{fmtDate(a.createdAt)}</dd>
              <dt className="text-muted-foreground">{R.drDetected}</dt>
              <dd className="font-medium">
                {r ? (
                  <>
                    {r.hasDR ? t.common.yes : t.common.no} (<span dir="ltr">{pct(r.stage1Confidence)}</span>)
                  </>
                ) : (
                  "—"
                )}
              </dd>
              <dt className="text-muted-foreground">{R.aiConfidence}</dt>
              <dd className="font-medium" dir="ltr">
                {pct(r?.confidence)}
              </dd>
              <dt className="text-muted-foreground">{R.followUp}</dt>
              <dd className="font-medium">{report.review?.followUpDate ? R.byDate(fmtDate(report.review.followUpDate)) : "—"}</dd>
            </dl>
          </div>
          {level !== null && <p className="text-[15px] leading-relaxed text-subtle-foreground">{t.grades.descriptions[level]}</p>}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <figure className="flex flex-col gap-2">
            <FundusImage src={a.image.fileUrl} alt={R.fundusCaption(eye)} />
            <figcaption className="text-[13px] text-muted-foreground">{R.fundusCaption(eye)}</figcaption>
          </figure>
          <figure className="flex flex-col gap-2">
            <GradCamOverlay imageSrc={a.image.fileUrl} gradCamSrc={r?.gradCamUrl} alt={R.heatmapAlt} showSlider={false} />
            <figcaption className="text-[13px] text-muted-foreground">{R.heatmapCaption}</figcaption>
          </figure>
        </section>

        {editable ? (
          <section className="flex flex-col gap-4">
            <Field label={R.notes}>
              {(p) => <Textarea {...p} rows={4} value={content} onChange={(e) => setContent(e.target.value)} />}
            </Field>
            <Field label={R.recommendations}>
              {(p) => <Textarea {...p} rows={3} value={recommendations} onChange={(e) => setRecommendations(e.target.value)} />}
            </Field>
            {dirty && (
              <Button variant="outline" className="self-start" onClick={() => act("save")} loading={busy === "save"}>
                {R.saveChanges}
              </Button>
            )}
          </section>
        ) : (
          <>
            <TextBlock title={R.notes} text={report.content} />
            <TextBlock title={R.recommendations} text={report.recommendations} />
          </>
        )}

        <footer className="border-t pt-5 text-[13px] leading-snug text-muted-foreground">{t.disclaimer.ai}</footer>
      </article>
    </>
  )
}

function InfoBlock({ title, rows }: { title: string; rows: [string, string | undefined | null][] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{title}</h2>
      <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-1.5 text-sm">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
      </dl>
    </section>
  )
}

function TextBlock({ title, text }: { title: string; text?: string }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-[15px] leading-relaxed whitespace-pre-line text-subtle-foreground">{text?.trim() || "—"}</p>
    </section>
  )
}
