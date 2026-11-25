/** /doctor/patients/[id] — one patient's record, history, reports, visits and notes. */

import { pageMetadata } from "@/lib/i18n/metadata"

import { PatientDetail } from "./patient-detail"

export const generateMetadata = pageMetadata("patient")

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <PatientDetail id={id} />
}
