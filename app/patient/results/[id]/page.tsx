"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { useI18n } from "@/components/i18n-provider"
import { LatestResult } from "@/components/patient/home"

export default function PatientResultRoute() {
  const { id } = useParams<{ id: string }>()
  const { t } = useI18n()
  return (
    <>
      <p className="text-sm text-muted-foreground">
        <Link href="/patient/results" className="text-primary hover:underline">
          {t.results.title}
        </Link>{" "}
        / {t.patientHome.resultLabel}
      </p>
      <section aria-label={t.patientHome.resultLabel} className="overflow-hidden rounded-2xl border bg-card">
        <LatestResult analysisId={id} />
      </section>
    </>
  )
}
