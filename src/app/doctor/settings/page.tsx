/** /doctor/settings — profile, clinic, license, security, preferences, notifications. */

import { pageMetadata } from "@/lib/i18n/metadata"

import { DoctorSettings } from "./doctor-settings"

export const generateMetadata = pageMetadata("settings")

export default function DoctorSettingsPage() {
  return <DoctorSettings />
}
