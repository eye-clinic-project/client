"use client"

import { useParams } from "next/navigation"

import { ReportPage } from "@/components/report/report-view"

export default function DoctorReportRoute() {
  const { id } = useParams<{ id: string }>()
  return <ReportPage id={id} role="doctor" />
}
