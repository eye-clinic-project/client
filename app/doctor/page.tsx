import { requireRole } from "@/lib/auth/require-role"
import { pageMetadata } from "@/lib/i18n/metadata"
import { DoctorDashboard } from "./doctor-dashboard"

export const generateMetadata = pageMetadata("dashboard")

export default async function DoctorDashboardPage() {
  const profile = await requireRole("doctor")
  return <DoctorDashboard name={profile.name} />
}
