/** /patient/reports/[id] — read one report. */

import { pageMetadata } from "@/lib/i18n/metadata"

import { PatientReport } from "./patient-report"

export const generateMetadata = pageMetadata("report")

export default async function PatientReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <PatientReport id={id} />
}
