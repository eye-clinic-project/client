/** /patient/settings — profile, medical info, notifications, security, preferences. */

import { pageMetadata } from "@/lib/i18n/metadata"

import { PatientSettings } from "./patient-settings"

export const generateMetadata = pageMetadata("settings")

export default function PatientSettingsPage() {
  return <PatientSettings />
}
