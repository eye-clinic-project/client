"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Check } from "lucide-react"

import { GradCamOverlay } from "@/components/rc/fundus"
import { ReportRows } from "@/components/report/report-list"
import { Alert, Avatar, ButtonLink, Card, CardHeader, Chip, EmptyState, GradeChip, PageTitle, Spinner } from "@/components/rc/ui"
import { useI18n } from "@/components/i18n-provider"
import { useApi } from "@/hooks/use-api"
import { useSession } from "@/hooks/use-session"
import { errorMessage } from "@/service/api-client"
import { analysisService } from "@/service/analysis.service"
import { appointmentService } from "@/service/appointment.service"
import { patientService } from "@/service/patient.service"
import { reportService } from "@/service/report.service"
import type { Appointment, DrLevel } from "@/lib/api-types"
import { GRADE_TEXT, isLevel } from "@/lib/grades"
import { doctorName, eyeLabel, firstName, fmtDate, fmtMonth, fmtTime, fmtWeekday, userOf } from "@/lib/format"
import { cn } from "@/lib/utils"

export function PatientHome() {
  const { me } = useSession()
  const { t } = useI18n()
  const H = t.patientHome
  const myId = me?.id ?? ""
  const nowIso = useMemo(() => new Date().toISOString(), [])
  const analyses = useApi(myId ? () => patientService.analyses(myId, { size: 20 }) : null, [myId])
  const completed = (analyses.data?.items ?? []).filter((a) => a.status === "completed")
  const latestId = completed[0]?.id
  const appointments = useApi(() => appointmentService.list({ from: nowIso, size: 10 }), [])
  const doctors = useApi(myId ? () => patientService.doctors(myId) : null, [myId])
  const reports = useApi(() => reportService.list({ size: 5 }), [])

  const next = (appointments.data?.items ?? [])
    .filter((a) => a.status === "pending" || a.status === "confirmed")
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))[0]
  const activeDoctors = (doctors.data ?? []).filter((d) => d.status === "active")

  return (
    <>
      <PageTitle>{H.hello(firstName(me?.name))}</PageTitle>
      {analyses.error ? <Alert>{errorMessage(analyses.error)}</Alert> : null}

      <div className="flex flex-wrap items-start gap-6">
        <section aria-label={H.latest} className="min-w-0 flex-[999_1_560px] overflow-hidden rounded-2xl border bg-card">
          {analyses.loading && !analyses.data ? (
            <Spinner />
          ) : latestId ? (
            <LatestResult analysisId={latestId} />
          ) : (
            <EmptyState title={H.noResults}>
              {H.noResultsHint}
            </EmptyState>
          )}
        </section>

        <aside className="flex flex-[1_1_320px] flex-col gap-4">
          <Card className="flex flex-col gap-3 p-5">
            <h2 className="text-base font-semibold">{H.nextAppointment}</h2>
            {next ? (
              <NextAppointment appointment={next} onCancelled={() => void appointments.reload()} />
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{H.noUpcoming}</p>
                <Link href="/patient/appointments" className="text-sm font-semibold text-primary hover:underline">
                  {H.book}
                </Link>
              </>
            )}
          </Card>
          <Card className="flex flex-col gap-3 p-5">
            <h2 className="text-base font-semibold">{H.myDoctor}</h2>
            {activeDoctors.length === 0 ? (
              <>
                <p className="text-sm text-muted-foreground">{H.noDoctor}</p>
                <Link href="/patient/doctors" className="text-sm font-semibold text-primary hover:underline">
                  {H.findDoctor}
                </Link>
              </>
            ) : (
              activeDoctors.map(({ doctor }) => (
                <div key={doctor.id} className="flex items-center gap-3">
                  <Avatar name={doctor.name} src={doctor.avatarUrl} size={44} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold">{doctorName(doctor.name)}</span>
                    <span className="truncate text-sm text-muted-foreground">
                      {doctor.profile?.specialty || doctor.profile?.clinicName || t.common.doctor}
                    </span>
                  </span>
                  <ButtonLink href={`/patient/messages?with=${doctor.id}`} variant="outline" size="sm">
                    {t.common.message}
                  </ButtonLink>
                </div>
              ))
            )}
          </Card>
        </aside>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <Card className="min-w-0 flex-[999_1_520px] overflow-hidden">
          <CardHeader
            title={H.myResults}
            action={
              <Link href="/patient/results" className="text-sm font-semibold text-primary hover:underline">
                {t.common.viewAll}
              </Link>
            }
          />
          {completed.length === 0 ? (
            <EmptyState title={H.noResultsShort} />
          ) : (
            <ul>
              {completed.slice(0, 5).map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-4 border-t border-muted px-5 py-3.5 first:border-t-0">
                  <span className="w-[110px] text-sm text-subtle-foreground">{fmtDate(a.createdAt)}</span>
                  <span className="w-[100px] text-sm text-subtle-foreground">{a.image.eye ? eyeLabel(a.image.eye) : "—"}</span>
                  <GradeChip level={a.result?.predictedLevel} />
                  <Link href={`/patient/results/${a.id}`} className="ms-auto text-sm font-semibold text-primary hover:underline">
                    {t.common.view}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="flex-[1_1_320px] overflow-hidden">
          <CardHeader
            title={H.reports}
            action={
              <Link href="/patient/reports" className="text-sm font-semibold text-primary hover:underline">
                {t.common.viewAll}
              </Link>
            }
          />
          {reports.data?.items.length ? (
            <ReportRows items={reports.data.items} base="/patient/reports" role="patient" />
          ) : (
            <EmptyState title={H.noReports} />
          )}
        </Card>
      </div>
    </>
  )
}

/** Latest result block: image with heatmap, plain-language grade, doctor's advice. */
export function LatestResult({ analysisId }: { analysisId: string }) {
  const { t } = useI18n()
  const H = t.patientHome
  const { data: a } = useApi(() => analysisService.getById(analysisId), [analysisId])
  if (!a?.result) return <Spinner />
  const review = a.reviews?.[0]
  const level: DrLevel | null = review && isLevel(review.confirmedLevel) ? review.confirmedLevel : isLevel(a.result.predictedLevel) ? a.result.predictedLevel : null
  const doctor = review?.doctor?.name ?? userOf(a.doctor)?.name
  return (
    <div className="flex flex-wrap">
      <div className="flex max-w-[340px] flex-[1_1_240px] items-center bg-[#0B0605] p-5">
        <GradCamOverlay
          imageSrc={a.image.fileUrl}
          gradCamSrc={a.result.gradCamUrl}
          alt={H.imageAlt}
          showSlider={false}
        />
      </div>
      <div className="flex flex-[999_1_320px] flex-col gap-3.5 p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {H.latestMeta(a.image.eye ? eyeLabel(a.image.eye) : H.eyeFallback, fmtDate(a.createdAt))}
          </span>
          {review ? (
            <Chip className="bg-accent text-accent-foreground">
              <Check className="size-3" strokeWidth={3} aria-hidden="true" />
              {H.reviewedBy(doctorName(doctor))}
            </Chip>
          ) : (
            <Chip className="bg-warning-bg text-warning-fg">{H.waitingReview}</Chip>
          )}
        </div>
        {level !== null && (
          <h2 className={cn("font-heading text-[30px] leading-tight font-semibold", GRADE_TEXT[level])}>
            {t.grades.full[level]}
          </h2>
        )}
        {level !== null && <p className="text-base leading-relaxed text-subtle-foreground">{t.grades.descriptions[level]}</p>}
        {(review?.recommendations || review?.followUpDate) && (
          <div className="flex flex-col gap-2.5 rounded-xl bg-[#FDF0E6] p-4 text-[#5E2A06] dark:bg-[#3d2212] dark:text-[#ffd2b0]">
            <span className="text-[15px] font-semibold">{H.nextSteps}</span>
            {review.recommendations && <span className="text-[15px] leading-normal">{review.recommendations}</span>}
            {review.followUpDate && (
              <span className="text-[15px] leading-normal">
                {H.followUpBefore(doctorName(doctor), fmtDate(review.followUpDate))}
              </span>
            )}
            <ButtonLink href="/patient/appointments" size="sm" className="self-start">
              {H.bookFollowUp}
            </ButtonLink>
          </div>
        )}
        <p className="text-[13px] text-muted-foreground">
          {t.disclaimer.patient}
        </p>
      </div>
    </div>
  )
}

function NextAppointment({ appointment: a, onCancelled }: { appointment: Appointment; onCancelled: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const { t } = useI18n()
  const H = t.patientHome
  const doctor = userOf(a.doctor)
  const d = new Date(a.scheduledAt)
  async function cancel() {
    if (!window.confirm(H.cancelAsk)) return
    try {
      await appointmentService.cancel(a.id)
      onCancelled()
    } catch (err) {
      setError(errorMessage(err))
    }
  }
  return (
    <>
      <div className="flex items-center gap-3.5">
        <span className="w-14 shrink-0 rounded-[10px] bg-accent py-2 text-center text-accent-foreground">
          <span className="block text-xs font-semibold uppercase">{fmtMonth(d)}</span>
          <span className="block font-heading text-2xl font-semibold">{d.getDate()}</span>
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="font-semibold">
            {fmtWeekday(d)} · {fmtTime(a.scheduledAt)} – {fmtTime(a.endAt)}
          </span>
          <span className="text-sm text-muted-foreground">{doctorName(doctor?.name)}</span>
          <span className={cn("text-[13px] font-semibold", a.status === "confirmed" ? "text-accent-foreground" : "text-warning-fg")}>
            {a.status === "confirmed" ? H.confirmed : H.waitingConfirm}
          </span>
        </span>
      </div>
      {error && <Alert>{error}</Alert>}
      <div className="flex gap-4">
        <Link href="/patient/appointments" className="text-sm font-semibold text-primary hover:underline">
          {H.reschedule}
        </Link>
        <button type="button" onClick={cancel} className="text-sm font-semibold text-danger-fg hover:underline">
          {t.common.cancel}
        </button>
      </div>
    </>
  )
}
