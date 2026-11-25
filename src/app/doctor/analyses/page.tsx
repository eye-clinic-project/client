/** /doctor/analyses — all analyses with filters, AI status and retry. */

import { pageMetadata } from "@/lib/i18n/metadata"

import { AnalysesView } from "./analyses-view"

export const generateMetadata = pageMetadata("analyses")

export default function AnalysesPage() {
  return <AnalysesView />
}
