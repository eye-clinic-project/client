"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { LatestResult } from "@/components/patient/home"

export default function PatientResultRoute() {
  const { id } = useParams<{ id: string }>()
  return (
    <>
      <p className="text-sm text-muted-foreground">
        <Link href="/patient/results" className="text-primary hover:underline">
          My results
        </Link>{" "}
        / Screening result
      </p>
      <section aria-label="Screening result" className="overflow-hidden rounded-2xl border bg-card">
        <LatestResult analysisId={id} />
      </section>
    </>
  )
}
