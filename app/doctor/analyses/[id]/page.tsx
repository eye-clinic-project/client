"use client"

import { useParams } from "next/navigation"

import { AnalysisResultPage } from "@/components/doctor/analysis-result"

export default function DoctorAnalysisRoute() {
  const { id } = useParams<{ id: string }>()
  return <AnalysisResultPage id={id} />
}
