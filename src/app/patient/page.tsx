/** /patient — home: greeting, next visit, latest reports, doctors and shortcuts. */

import { requireRole } from "@/lib/auth/require-role"
import { pageMetadata } from "@/lib/i18n/metadata"

import { PatientHome } from "./patient-home"

export const generateMetadata = pageMetadata("home")

export default async function PatientHomePage() {
  const profile = await requireRole("patient")
  return <PatientHome name={profile.name} />
}
