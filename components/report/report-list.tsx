"use client"

import Link from "next/link"
import { useState } from "react"
import { Download } from "lucide-react"

import { Alert, Card, EmptyState, PageTitle, RateLimitNotice, Spinner, StatusChip } from "@/components/rc/ui"
import { useApi, useCooldown } from "@/hooks/use-api"
import { errorMessage, RateLimitError } from "@/service/api-client"
import { reportService } from "@/service/report.service"
import type { ReportSummary } from "@/lib/api-types"
import { doctorName, fmtDate, userOf } from "@/lib/format"

export function ReportList({ role }: { role: "doctor" | "patient" }) {
  const { data, error, loading } = useApi(() => reportService.list({ size: 50 }), [])
  const base = role === "doctor" ? "/doctor/reports" : "/patient/reports"
  return (
    <>
      <PageTitle>Reports</PageTitle>
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      <Card className="overflow-hidden">
        {loading && !data ? (
          <Spinner />
        ) : !data?.items.length ? (
          <EmptyState title="No reports yet">
            {role === "doctor"
              ? "Generate a report from a completed analysis."
              : "Your doctor will send you a report after reviewing your screening."}
          </EmptyState>
        ) : (
          <ReportRows items={data.items} base={base} role={role} />
        )}
      </Card>
    </>
  )
}

export function ReportRows({ items, base, role }: { items: ReportSummary[]; base: string; role: "doctor" | "patient" }) {
  const cooldown = useCooldown()
  const [error, setError] = useState<string | null>(null)
  async function download(r: ReportSummary) {
    setError(null)
    try {
      await reportService.downloadPdf(r)
    } catch (err) {
      cooldown.trip(err)
      if (!(err instanceof RateLimitError)) setError(errorMessage(err))
    }
  }
  return (
    <>
      {error && <Alert className="m-4">{error}</Alert>}
      <RateLimitNotice remaining={cooldown.remaining} className="m-4" />
      <ul>
        {items.map((r) => {
          const other = userOf(role === "doctor" ? r.patient : r.doctor)
          return (
            <li key={r.id} className="flex items-center gap-3 border-t px-5 py-3.5 first:border-t-0">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Link href={`${base}/${r.id}`} className="truncate font-semibold hover:text-primary hover:underline">
                  {r.title}
                </Link>
                <span className="text-[13px] text-muted-foreground">
                  {role === "doctor" ? other?.name ?? "Patient" : `From ${doctorName(other?.name)}`} ·{" "}
                  {fmtDate(r.sentAt ?? r.createdAt)}
                  {role === "patient" && !r.viewedAt ? " · New" : ""}
                </span>
              </span>
              {role === "doctor" && <StatusChip status={r.status} label={r.status === "sent" ? "Sent" : "Draft"} />}
              <button
                type="button"
                onClick={() => download(r)}
                disabled={cooldown.active}
                aria-label={`Download PDF, ${r.title}`}
                className="flex size-11 shrink-0 items-center justify-center rounded-[9px] border border-input hover:bg-muted disabled:opacity-50"
              >
                <Download className="size-[18px] text-primary" aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}
