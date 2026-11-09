"use client"

import Link from "next/link"

import { Alert, Card, EmptyState, GradeChip, PageTitle, Spinner, StatusChip } from "@/components/rc/ui"
import { useApi } from "@/hooks/use-api"
import { useSession } from "@/hooks/use-session"
import { errorMessage } from "@/service/api-client"
import { patientService } from "@/service/patient.service"
import { EYE_LABELS, fmtDate } from "@/lib/format"

export function PatientResults() {
  const { me } = useSession()
  const { data, error, loading } = useApi(me ? () => patientService.analyses(me.id, { size: 50 }) : null, [me?.id])
  return (
    <>
      <PageTitle>My results</PageTitle>
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      <Card className="overflow-hidden">
        {loading && !data ? (
          <Spinner />
        ) : !data?.items.length ? (
          <EmptyState title="No results yet">After your doctor uploads an image of your eye, the result appears here.</EmptyState>
        ) : (
          <ul>
            {data.items.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-4 border-t border-muted px-5 py-3.5 first:border-t-0">
                <span className="w-[110px] text-sm text-subtle-foreground">{fmtDate(a.createdAt)}</span>
                <span className="w-[80px] text-sm text-subtle-foreground">{a.image.eye ? EYE_LABELS[a.image.eye] : "—"}</span>
                {a.status === "completed" ? <GradeChip level={a.result?.predictedLevel} /> : <StatusChip status={a.status} label="Not ready yet" />}
                {a.status === "completed" && (
                  <Link href={`/patient/results/${a.id}`} className="ml-auto text-sm font-semibold text-primary hover:underline">
                    View
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
