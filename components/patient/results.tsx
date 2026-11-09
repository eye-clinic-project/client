"use client"

import Link from "next/link"

import { Alert, Card, EmptyState, GradeChip, PageTitle, Spinner, StatusChip } from "@/components/rc/ui"
import { useI18n } from "@/components/i18n-provider"
import { useApi } from "@/hooks/use-api"
import { useSession } from "@/hooks/use-session"
import { errorMessage } from "@/service/api-client"
import { patientService } from "@/service/patient.service"
import { eyeLabel, fmtDate } from "@/lib/format"

export function PatientResults() {
  const { me } = useSession()
  const { t } = useI18n()
  const { data, error, loading } = useApi(me ? () => patientService.analyses(me.id, { size: 50 }) : null, [me?.id])
  return (
    <>
      <PageTitle>{t.results.title}</PageTitle>
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      <Card className="overflow-hidden">
        {loading && !data ? (
          <Spinner />
        ) : !data?.items.length ? (
          <EmptyState title={t.results.none}>{t.patientHome.noResultsHint}</EmptyState>
        ) : (
          <ul>
            {data.items.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-4 border-t border-muted px-5 py-3.5 first:border-t-0">
                <span className="w-[110px] text-sm text-subtle-foreground">{fmtDate(a.createdAt)}</span>
                <span className="w-[100px] text-sm text-subtle-foreground">{a.image.eye ? eyeLabel(a.image.eye) : "—"}</span>
                {a.status === "completed" ? <GradeChip level={a.result?.predictedLevel} /> : <StatusChip status={a.status} label={t.patientHome.notReady} />}
                {a.status === "completed" && (
                  <Link href={`/patient/results/${a.id}`} className="ms-auto text-sm font-semibold text-primary hover:underline">
                    {t.common.view}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
