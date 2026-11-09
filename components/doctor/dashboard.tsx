"use client"

import Link from "next/link"
import { Plus } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { NotificationBell } from "@/components/shell/notification-bell"
import { Alert, ButtonLink, Card, CardHeader, EmptyState, GradeChip, PageTitle, Spinner, StatusChip } from "@/components/rc/ui"
import { useApi } from "@/hooks/use-api"
import { useSession } from "@/hooks/use-session"
import { errorMessage } from "@/service/api-client"
import { doctorService } from "@/service/doctor.service"
import { eyeShort, firstName, fmtLongDay, fmtRelative, fmtTime, greeting, pct, userOf } from "@/lib/format"

export function DoctorDashboard() {
  const { me } = useSession()
  const { t } = useI18n()
  const d = t.dashboard
  const { data, error, loading } = useApi(() => doctorService.dashboard(), [])

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle eyebrow={fmtLongDay()}>{d.greeting(greeting(), firstName(me?.name))}</PageTitle>
        <div className="flex flex-wrap gap-3">
          <NotificationBell size={48} />
          <ButtonLink href="/doctor/patients?add=1" variant="outline">
            {d.addPatient}
          </ButtonLink>
          <ButtonLink href="/doctor/scan">
            <Plus className="size-[18px]" aria-hidden="true" /> {d.newScan}
          </ButtonLink>
        </div>
      </header>

      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      {loading && !data && <Spinner />}

      {data && (
        <>
          <section aria-label={d.summary} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label={d.activePatients} value={data.patients}>
              {data.pendingPatientRequests > 0 ? (
                <Link href="/doctor/patients?tab=requests" className="font-medium text-primary hover:underline">
                  {d.requestsWaiting(data.pendingPatientRequests)}
                </Link>
              ) : (
                d.noRequests
              )}
            </Stat>
            <Stat label={d.referable} value={data.referableCases} tone="text-[#9A3A06] dark:text-[#ffb98a]">
              {d.moderatePlus}
            </Stat>
            <Stat label={d.draftReports} value={data.draftReports}>
              {d.notSent}
            </Stat>
            <Stat
              label={d.failedAnalyses}
              value={data.failedAnalyses}
              tone={data.failedAnalyses ? "text-[#A11B1B] dark:text-[#ffaaaa]" : undefined}
            >
              {data.failedAnalyses ? (
                <Link href="/doctor/scan?failed=1" className="font-semibold text-primary hover:underline">
                  {d.retryNow}
                </Link>
              ) : (
                d.allRan
              )}
            </Stat>
          </section>

          <div className="flex flex-wrap items-start gap-5">
            <Card className="min-w-0 flex-[999_1_520px] overflow-hidden rounded-[14px]">
              <CardHeader
                title={d.recent}
                action={
                  <Link href="/doctor/patients" className="text-sm font-semibold text-primary hover:underline">
                    {t.common.viewAll}
                  </Link>
                }
              />
              {data.recentAnalyses.length === 0 ? (
                <EmptyState title={d.noAnalyses}>{d.noAnalysesHint}</EmptyState>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-sm">
                    <thead>
                      <tr className="text-start text-[13px] whitespace-nowrap text-muted-foreground">
                        <th className="px-5 py-3 text-start font-semibold">{d.colPatient}</th>
                        <th className="px-2 py-3 text-start font-semibold">{d.colEye}</th>
                        <th className="px-2 py-3 text-start font-semibold">{d.colGrade}</th>
                        <th className="px-2 py-3 text-start font-semibold">{d.colConfidence}</th>
                        <th className="px-5 py-3">
                          <span className="sr-only">{d.colAction}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentAnalyses.map((a) => {
                        const patient = userOf(a.patient)
                        return (
                          <tr key={a.id} className="border-t border-muted">
                            <td className="px-5 py-3.5">
                              <span className="flex flex-col gap-0.5">
                                <span className="font-semibold">{patient?.name ?? t.common.patient}</span>
                                <span className="text-[13px] text-muted-foreground">{fmtRelative(a.createdAt)}</span>
                              </span>
                            </td>
                            <td className="px-2 py-3.5 text-subtle-foreground">{a.image.eye ? eyeShort(a.image.eye) : "—"}</td>
                            <td className="px-2 py-3.5">
                              {a.status === "completed" ? (
                                <GradeChip level={a.result?.predictedLevel} />
                              ) : (
                                <StatusChip status={a.status} />
                              )}
                            </td>
                            <td className="px-2 py-3.5 text-subtle-foreground" dir="ltr">
                              {pct(a.result?.confidence)}
                            </td>
                            <td className="px-5 py-3.5 text-end">
                              <Link href={`/doctor/analyses/${a.id}`} className="font-semibold text-primary hover:underline">
                                {t.common.open}
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card className="flex flex-[1_1_320px] flex-col gap-4 rounded-[14px] p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[17px] font-semibold">{d.today}</h2>
                <Link href="/doctor/appointments" className="text-sm font-semibold text-primary hover:underline">
                  {d.calendar}
                </Link>
              </div>
              {data.todayAppointments.length === 0 && <p className="text-sm text-muted-foreground">{d.noToday}</p>}
              {data.todayAppointments.map((a) => (
                <div key={a.id} className="flex items-center gap-3.5">
                  <span className="w-16 shrink-0 font-heading text-base font-semibold">{fmtTime(a.scheduledAt)}</span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[15px] font-semibold">{a.patient?.name}</span>
                    <span className="truncate text-[13px] text-muted-foreground">{a.reason || d.appointment}</span>
                  </span>
                  <StatusChip status={a.status} />
                </div>
              ))}
              {data.pendingPatientRequests > 0 && (
                <div className="mt-1 rounded-[10px] bg-warning-bg p-3.5 text-sm leading-snug text-warning-fg">
                  {d.askedToFollow(data.pendingPatientRequests)}{" "}
                  <Link href="/doctor/patients?tab=requests" className="font-semibold underline">
                    {d.reviewRequests}
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  )
}

function Stat({ label, value, tone, children }: { label: string; value: number; tone?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-[14px] border bg-card p-5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-heading text-[34px] leading-none font-semibold ${tone ?? ""}`}>{value}</span>
      <span className="text-[13px] text-muted-foreground">{children}</span>
    </div>
  )
}
