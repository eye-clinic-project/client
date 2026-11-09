"use client"

import Link from "next/link"
import { useState } from "react"
import { Download, Send } from "lucide-react"

import { FundusImage, GradCamOverlay } from "@/components/rc/fundus"
import { Alert, Button, Field, Logo, RateLimitNotice, Spinner, StatusChip, Textarea } from "@/components/rc/ui"
import { useApi, useCooldown } from "@/hooks/use-api"
import { errorMessage, RateLimitError } from "@/service/api-client"
import { reportService } from "@/service/report.service"
import type { DrLevel, Report } from "@/lib/api-types"
import { GRADE_LABELS, GRADE_TEXT, isLevel } from "@/lib/grades"
import { DIABETES_LABELS, doctorName, EYE_LABELS, fmtDate, pct, userOf } from "@/lib/format"
import { cn } from "@/lib/utils"

export function ReportPage({ id, role }: { id: string; role: "doctor" | "patient" }) {
  const { data, error, setData } = useApi(() => reportService.getById(id), [id])
  if (error) return <Alert>{errorMessage(error)}</Alert>
  if (!data) return <Spinner />
  return <ReportView report={data} role={role} onChange={setData} />
}

function ReportView({ report, role, onChange }: { report: Report; role: "doctor" | "patient"; onChange: (r: Report) => void }) {
  const cooldown = useCooldown()
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
  const eye = a.image.eye ? EYE_LABELS[a.image.eye].toLowerCase() : "eye"
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
        setNotice("Changes saved.")
      }
      if (kind === "send") {
        if (dirty) await reportService.update(report.id, { content, recommendations })
        onChange(await reportService.send(report.id))
        setNotice(`Report sent to ${patient?.name ?? "the patient"}. They will get a notification.`)
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
            Reports
          </Link>{" "}
          / {fmtDate(report.createdAt)}
        </p>
        <div className="flex flex-wrap gap-3">
          {role === "doctor" && report.status === "draft" && (
            <Button onClick={() => act("send")} loading={busy === "send"} disabled={cooldown.active}>
              <Send className="size-4" aria-hidden="true" /> Send to patient
            </Button>
          )}
          <Button variant="outline" onClick={() => act("pdf")} loading={busy === "pdf"} disabled={cooldown.active}>
            <Download className="size-4" aria-hidden="true" /> Download PDF
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
            {role === "doctor" && <StatusChip status={report.status} label={report.status === "sent" ? "Sent" : "Draft"} />}
            {report.sentAt && <span>Sent {fmtDate(report.sentAt)}</span>}
          </div>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          <InfoBlock
            title="Patient"
            rows={[
              ["Name", patient?.name],
              ["Patient ID", patientProfile?.medicalRecordNumber],
              ["Date of birth", patientProfile?.dateOfBirth ? fmtDate(patientProfile.dateOfBirth) : undefined],
              ["Sex", patientProfile?.gender ? (patientProfile.gender === "male" ? "Male" : "Female") : undefined],
              ["Diabetes", patientProfile?.diabetesType ? DIABETES_LABELS[patientProfile.diabetesType] : undefined],
            ]}
          />
          <InfoBlock
            title="Doctor"
            rows={[
              ["Name", doctorName(doctor?.name)],
              ["Clinic", doctorProfile?.clinicName],
              ["Specialty", doctorProfile?.specialty],
            ]}
          />
        </div>

        <section className="flex flex-col gap-4 rounded-2xl bg-muted p-5 sm:p-6">
          <h2 className="text-base font-semibold">Result</h2>
          <div className="flex flex-wrap gap-6">
            <div className="flex min-w-[220px] flex-1 flex-col gap-1">
              <span className="text-sm text-muted-foreground">
                {report.review ? "Confirmed grade" : "AI grade"} ({eye})
              </span>
              <span className={cn("font-heading text-[30px] leading-tight font-semibold", level !== null && GRADE_TEXT[level])}>
                {level === null ? "—" : level === 0 ? "No DR" : `${GRADE_LABELS[level]} DR`}
              </span>
              {level !== null && (
                <span className="text-sm text-subtle-foreground">
                  Grade {level} of 4 ·{" "}
                  {report.review
                    ? report.review.aiResultConfirmed
                      ? "AI result confirmed"
                      : "Grade changed by doctor"
                    : "Not yet reviewed"}
                </span>
              )}
            </div>
            <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Screening date</dt>
              <dd className="font-medium">{fmtDate(a.createdAt)}</dd>
              <dt className="text-muted-foreground">DR detected</dt>
              <dd className="font-medium">{r ? `${r.hasDR ? "Yes" : "No"} (${pct(r.stage1Confidence)})` : "—"}</dd>
              <dt className="text-muted-foreground">AI confidence</dt>
              <dd className="font-medium">{pct(r?.confidence)}</dd>
              <dt className="text-muted-foreground">Follow-up</dt>
              <dd className="font-medium">{report.review?.followUpDate ? `By ${fmtDate(report.review.followUpDate)}` : "—"}</dd>
            </dl>
          </div>
          {r?.gradeDescription && <p className="text-[15px] leading-relaxed text-subtle-foreground">{r.gradeDescription}</p>}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <figure className="flex flex-col gap-2">
            <FundusImage src={a.image.fileUrl} alt={`Fundus image, ${eye}`} />
            <figcaption className="text-[13px] text-muted-foreground">Fundus image, {eye}</figcaption>
          </figure>
          <figure className="flex flex-col gap-2">
            <GradCamOverlay imageSrc={a.image.fileUrl} gradCamSrc={r?.gradCamUrl} alt="Grad-CAM heatmap" showSlider={false} />
            <figcaption className="text-[13px] text-muted-foreground">
              Grad-CAM heatmap: areas that influenced the AI result
            </figcaption>
          </figure>
        </section>

        {editable ? (
          <section className="flex flex-col gap-4">
            <Field label="Doctor notes">
              {(p) => <Textarea {...p} rows={4} value={content} onChange={(e) => setContent(e.target.value)} />}
            </Field>
            <Field label="Recommendations">
              {(p) => <Textarea {...p} rows={3} value={recommendations} onChange={(e) => setRecommendations(e.target.value)} />}
            </Field>
            {dirty && (
              <Button variant="outline" className="self-start" onClick={() => act("save")} loading={busy === "save"}>
                Save changes
              </Button>
            )}
          </section>
        ) : (
          <>
            <TextBlock title="Doctor notes" text={report.content} />
            <TextBlock title="Recommendations" text={report.recommendations} />
          </>
        )}

        <footer className="border-t pt-5 text-[13px] leading-snug text-muted-foreground">{report.disclaimer}</footer>
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
