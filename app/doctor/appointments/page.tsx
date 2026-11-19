import { pageMetadata } from "@/lib/i18n/metadata"
import { AppointmentsView } from "./appointments-view"

export const generateMetadata = pageMetadata("appointments")

export default function AppointmentsPage() {
  return <AppointmentsView />
}
