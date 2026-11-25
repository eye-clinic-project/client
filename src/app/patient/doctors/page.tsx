/** /patient/doctors — doctors assigned to me. */

import { pageMetadata } from "@/lib/i18n/metadata"

import { PatientDoctors } from "./patient-doctors"

export const generateMetadata = pageMetadata("doctors")

export default function PatientDoctorsPage() {
  return <PatientDoctors />
}
