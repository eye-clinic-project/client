/** /patient/reports — reports my doctors have sent me. */

import { pageMetadata } from "@/lib/i18n/metadata"

import { PatientReports } from "./patient-reports"

export const generateMetadata = pageMetadata("reports")

export default function PatientReportsPage() {
  return <PatientReports />
}
