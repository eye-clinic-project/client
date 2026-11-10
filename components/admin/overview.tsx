"use client"

import Link from "next/link"
import { ArrowRight, CalendarDays, FileText, ImageIcon, ScanEye, ShieldAlert, ShieldCheck, Stethoscope, UserRound } from "lucide-react"
import type { ComponentType } from "react"

import { useI18n } from "@/components/i18n-provider"
import { Alert, Avatar, ButtonLink, Card, CardHeader, EmptyState, PageTitle, Spinner } from "@/components/rc/ui"
import { useApi } from "@/hooks/use-api"
import { useSession } from "@/hooks/use-session"
import { GRADE_COLOR, GRADES } from "@/lib/grades"
import { firstName, fmtLongDay, fmtRelative, greeting } from "@/lib/format"
import { cn } from "@/lib/utils"
import { adminService } from "@/service/admin.service"
import { errorMessage } from "@/service/api-client"

export function AdminOverview() {
  const { me } = useSession()
  const { t } = useI18n()
  const a = t.admin
  const stats = useApi(() => adminService.dashboard(), [])
  const queue = useApi(() => adminService.doctors({ status: "pending", size: 4 }), [])
  const data = stats.data

  const pending = data?.pendingDoctors ?? queue.data?.total ?? 0
  const grades = GRADES.map((level) => ({ level, count: data?.gradeDistribution[String(level)] ?? 0 }))
  const gradeTotal = grades.reduce((sum, g) => sum + g.count, 0)

  return (
    <>
      <PageTitle eyebrow={fmtLongDay()}>{`${greeting()}, ${firstName(me?.name)}`}</PageTitle>

      {stats.error ? <Alert>{errorMessage(stats.error)}</Alert> : null}

      <section
        className={cn(
          "flex flex-col gap-5 rounded-2xl p-6 sm:flex-row sm:items-center sm:p-7",
          pending ? "bg-brand-deep text-white" : "border bg-card",
        )}
      >
        <span
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-2xl",
            pending ? "bg-white/10" : "bg-accent text-primary",
          )}
        >
          {pending ? <ShieldAlert className="size-7" aria-hidden="true" /> : <ShieldCheck className="size-7" aria-hidden="true" />}
        </span>
        <div className="flex flex-1 flex-col gap-1">
          <h2 className="font-heading text-xl font-semibold">{a.pendingTitle}</h2>
          <p className={cn("text-[15px]", pending ? "text-white/80" : "text-muted-foreground")}>
            {pending ? a.pendingBody(pending) : a.noPending}
          </p>
        </div>
        {pending > 0 && (
          <ButtonLink href="/admin/doctors" className="bg-white text-brand-deep hover:bg-white/90">
            {a.reviewNow} <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          </ButtonLink>
        )}
      </section>

      {stats.loading && !data && <Spinner />}

      {data && (
        <section aria-label={a.overviewTitle} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat icon={Stethoscope} label={a.stats.doctors} value={data.users.doctor ?? 0} />
          <Stat icon={UserRound} label={a.stats.patients} value={data.users.patient ?? 0} />
          <Stat icon={ScanEye} label={a.stats.analyses30} value={data.analysesLast30Days} />
          <Stat icon={FileText} label={a.stats.reports} value={data.reports} />
          <Stat icon={CalendarDays} label={a.stats.appointments} value={data.appointments} />
          <Stat icon={ImageIcon} label={a.stats.images} value={data.fundusImages} />
          <Stat icon={ShieldCheck} label={a.stats.admins} value={data.users.admin ?? 0} />
          <Stat icon={ShieldAlert} label={a.stats.pendingReviews} value={pending} highlight={pending > 0} />
        </section>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader
            title={a.doctorsTitle}
            action={
              <Link href="/admin/doctors" className="text-sm font-semibold text-primary hover:underline">
                {t.common.viewAll}
              </Link>
            }
          />
          {queue.loading && !queue.data && <Spinner />}
          {queue.data && !queue.data.items.length && <EmptyState title={a.emptyPending} />}
          <ul>
            {queue.data?.items.map((doctor) => (
              <li key={doctor.id} className="flex items-center gap-3 border-t px-5 py-3.5 first:border-t-0">
                <Avatar name={doctor.name} src={doctor.avatarUrl} size={40} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-semibold">{doctor.name}</span>
                  <span className="truncate text-sm text-muted-foreground">
                    {doctor.profile?.clinicName} · <span dir="ltr" className="font-mono">{doctor.profile?.licenseNumber ?? a.noLicense}</span>
                  </span>
                </div>
                <span className="hidden text-sm text-muted-foreground sm:block">
                  {fmtRelative(doctor.profile?.verificationSubmittedAt ?? doctor.createdAt ?? null)}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        {data && (
          <Card className="p-6">
            <h2 className="mb-4 text-[17px] font-semibold">{a.gradesTitle}</h2>
            <div className="flex flex-col gap-3">
              {grades.map(({ level, count }) => {
                const share = gradeTotal ? Math.round((count / gradeTotal) * 100) : 0
                return (
                  <div key={level} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{t.grades.short[level]}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {count} · {share}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${share}%`, background: GRADE_COLOR[level] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: "true" }>
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <Card className={cn("flex flex-col gap-3 p-5", highlight && "border-[#C2410C]/40 bg-warning-bg")}>
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-lg",
          highlight ? "bg-[#C2410C] text-white" : "bg-accent text-primary",
        )}
      >
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="font-heading text-[28px] leading-none font-semibold tabular-nums">{value}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </Card>
  )
}
