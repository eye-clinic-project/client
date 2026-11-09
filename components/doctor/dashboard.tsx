"use client"

import Link from "next/link"
import { Plus } from "lucide-react"

import { NotificationBell } from "@/components/shell/notification-bell"
import { Alert, ButtonLink, Card, CardHeader, EmptyState, GradeChip, PageTitle, Spinner, StatusChip } from "@/components/rc/ui"
import { useApi } from "@/hooks/use-api"
import { useSession } from "@/hooks/use-session"
import { errorMessage } from "@/service/api-client"
import { doctorService } from "@/service/doctor.service"
import { EYE_LABELS, firstName, fmtLongDay, fmtRelative, fmtTime, pct, userOf } from "@/lib/format"

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"
}

export function DoctorDashboard() {
  const { me } = useSession()
  const { data, error, loading } = useApi(() => doctorService.dashboard(), [])

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle eyebrow={fmtLongDay()}>
          {greeting()}, Dr. {firstName(me?.name)}
        </PageTitle>
        <div className="flex flex-wrap gap-3">
          <NotificationBell size={48} />
          <ButtonLink href="/doctor/patients?add=1" variant="outline">
            Add patient
          </ButtonLink>
          <ButtonLink href="/doctor/scan">
            <Plus className="size-[18px]" aria-hidden="true" /> New scan
          </ButtonLink>
        </div>
      </header>

      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      {loading && !data && <Spinner />}

      {data && (
        <>
          <section aria-label="Summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Active patients" value={data.patients}>
              {data.pendingPatientRequests > 0 ? (
                <Link href="/doctor/patients?tab=requests" className="font-medium text-primary hover:underline">
                  {data.pendingPatientRequests} request{data.pendingPatientRequests === 1 ? "" : "s"} waiting
                </Link>
              ) : (
                "No requests waiting"
              )}
            </Stat>
            <Stat label="Referable cases" value={data.referableCases} tone="text-[#9A3A06] dark:text-[#ffb98a]">
              Moderate and above
            </Stat>
            <Stat label="Draft reports" value={data.draftReports}>
              Not sent to patients
            </Stat>
            <Stat label="Failed analyses" value={data.failedAnalyses} tone={data.failedAnalyses ? "text-[#A11B1B] dark:text-[#ffaaaa]" : undefined}>
              {data.failedAnalyses ? (
                <Link href="/doctor/scan?failed=1" className="font-semibold text-primary hover:underline">
                  Retry now
                </Link>
              ) : (
                "All analyses ran"
              )}
            </Stat>
          </section>

          <div className="flex flex-wrap items-start gap-5">
            <Card className="min-w-0 flex-[999_1_520px] overflow-hidden rounded-[14px]">
              <CardHeader
                title="Recent analyses"
                action={
                  <Link href="/doctor/patients" className="text-sm font-semibold text-primary hover:underline">
                    View all
                  </Link>
                }
              />
              {data.recentAnalyses.length === 0 ? (
                <EmptyState title="No analyses yet">Upload a fundus image to run your first analysis.</EmptyState>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-[13px] text-muted-foreground">
                        <th className="px-5 py-3 font-semibold">Patient</th>
                        <th className="px-2 py-3 font-semibold">Eye</th>
                        <th className="px-2 py-3 font-semibold">AI grade</th>
                        <th className="px-2 py-3 font-semibold">Confidence</th>
                        <th className="px-5 py-3">
                          <span className="sr-only">Action</span>
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
                                <span className="font-semibold">{patient?.name ?? "Patient"}</span>
                                <span className="text-[13px] text-muted-foreground">{fmtRelative(a.createdAt)}</span>
                              </span>
                            </td>
                            <td className="px-2 py-3.5 text-subtle-foreground">
                              {a.image.eye ? EYE_LABELS[a.image.eye].replace(" eye", "") : "—"}
                            </td>
                            <td className="px-2 py-3.5">
                              {a.status === "completed" ? (
                                <GradeChip level={a.result?.predictedLevel} />
                              ) : (
                                <StatusChip status={a.status} />
                              )}
                            </td>
                            <td className="px-2 py-3.5 text-subtle-foreground">{pct(a.result?.confidence)}</td>
                            <td className="px-5 py-3.5 text-right">
                              <Link href={`/doctor/analyses/${a.id}`} className="font-semibold text-primary hover:underline">
                                Open
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
                <h2 className="text-[17px] font-semibold">Today</h2>
                <Link href="/doctor/appointments" className="text-sm font-semibold text-primary hover:underline">
                  Calendar
                </Link>
              </div>
              {data.todayAppointments.length === 0 && (
                <p className="text-sm text-muted-foreground">No appointments today.</p>
              )}
              {data.todayAppointments.map((a) => (
                <div key={a.id} className="flex items-center gap-3.5">
                  <span className="w-16 shrink-0 font-heading text-base font-semibold">{fmtTime(a.scheduledAt)}</span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[15px] font-semibold">{a.patient?.name}</span>
                    <span className="truncate text-[13px] text-muted-foreground">{a.reason || "Appointment"}</span>
                  </span>
                  <StatusChip status={a.status} />
                </div>
              ))}
              {data.pendingPatientRequests > 0 && (
                <div className="mt-1 rounded-[10px] bg-warning-bg p-3.5 text-sm leading-snug text-warning-fg">
                  {data.pendingPatientRequests} patient{data.pendingPatientRequests === 1 ? "" : "s"} asked to be followed
                  by you.{" "}
                  <Link href="/doctor/patients?tab=requests" className="font-semibold underline">
                    Review requests
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

function Stat({
  label,
  value,
  tone,
  children,
}: {
  label: string
  value: number
  tone?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[14px] border bg-card p-5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-heading text-[34px] leading-none font-semibold ${tone ?? ""}`}>{value}</span>
      <span className="text-[13px] text-muted-foreground">{children}</span>
    </div>
  )
}
