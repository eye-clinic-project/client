import { pageMetadata } from "@/lib/i18n/metadata"
import { ReportsView } from "./reports-view"

export const generateMetadata = pageMetadata("reports")

export default function ReportsPage() {
  return <ReportsView />
}
