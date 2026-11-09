"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"

import {
  Alert,
  Avatar,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  PageTitle,
  RateLimitNotice,
  Spinner,
  StatusChip,
  controlClass,
} from "@/components/rc/ui"
import { useI18n } from "@/components/i18n-provider"
import { useApi, useCooldown } from "@/hooks/use-api"
import { useSession } from "@/hooks/use-session"
import { errorMessage, RateLimitError } from "@/service/api-client"
import { doctorService } from "@/service/doctor.service"
import { assignmentService, patientService } from "@/service/patient.service"
import { doctorName } from "@/lib/format"
import { cn } from "@/lib/utils"

export function PatientDoctors() {
  const { me } = useSession()
  const cooldown = useCooldown()
  const { t } = useI18n()
  const D = t.doctors
  const mine = useApi(me ? () => patientService.doctors(me.id) : null, [me?.id])
  const [q, setQ] = useState("")
  const [term, setTerm] = useState("")
  useEffect(() => {
    const t = window.setTimeout(() => setTerm(q.trim()), 300)
    return () => window.clearTimeout(t)
  }, [q])
  const search = useApi(() => doctorService.search({ search: term || undefined, size: 10 }), [term])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const linked = new Map((mine.data ?? []).map((d) => [d.doctor.id, d.status]))

  async function request(doctorId: string, name: string) {
    setBusy(doctorId)
    setError(null)
    setDone(null)
    try {
      await assignmentService.create({ doctorId })
      setDone(D.sent(doctorName(name)))
      void mine.reload()
    } catch (err) {
      cooldown.trip(err)
      if (!(err instanceof RateLimitError)) setError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <PageTitle>{D.title}</PageTitle>
      <Card className="overflow-hidden">
        <CardHeader title={D.mine} />
        {mine.loading && !mine.data ? (
          <Spinner />
        ) : !mine.data?.length ? (
          <EmptyState title={D.none}>{D.noneHint}</EmptyState>
        ) : (
          <ul>
            {mine.data.map(({ doctor, status }) => (
              <li key={doctor.id} className="flex flex-wrap items-center gap-3 border-t px-5 py-4 first:border-t-0">
                <Avatar name={doctor.name} src={doctor.avatarUrl} size={44} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">{doctorName(doctor.name)}</span>
                  <span className="truncate text-sm text-muted-foreground">
                    {[doctor.profile?.specialty, doctor.profile?.clinicName, doctor.city].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <StatusChip status={status} label={status === "pending" ? D.requestSent : D.following} />
                {status === "active" && (
                  <ButtonLink href={`/patient/messages?with=${doctor.id}`} variant="outline" size="sm">
                    {t.common.message}
                  </ButtonLink>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <h2 className="text-[17px] font-semibold">{D.find}</h2>
        {error && <Alert>{error}</Alert>}
        {done && <Alert tone="success">{done}</Alert>}
        <RateLimitNotice remaining={cooldown.remaining} />
        <div className="relative">
          <label htmlFor="doctor-search" className="sr-only">
            {D.searchLabel}
          </label>
          <Search className="absolute top-1/2 start-3.5 size-[18px] -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            id="doctor-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={D.searchPlaceholder}
            className={cn(controlClass, "ps-10")}
          />
        </div>
        {search.loading && !search.data ? (
          <Spinner />
        ) : !search.data?.items.length ? (
          <EmptyState title={D.notFound} />
        ) : (
          <ul className="overflow-hidden rounded-xl border">
            {search.data.items.map((d) => {
              const status = linked.get(d.id)
              return (
                <li key={d.id} className="flex flex-wrap items-center gap-3 border-t px-4 py-3.5 first:border-t-0">
                  <Avatar name={d.name} src={d.avatarUrl} size={40} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-semibold">{doctorName(d.name)}</span>
                    <span className="truncate text-sm text-muted-foreground">
                      {[d.profile?.specialty, d.profile?.clinicName, d.city].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  {status ? (
                    <StatusChip status={status} label={status === "pending" ? D.requestSent : D.following} />
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={busy === d.id}
                      disabled={cooldown.active}
                      onClick={() => request(d.id, d.name)}
                    >
                      {D.ask}
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </>
  )
}
