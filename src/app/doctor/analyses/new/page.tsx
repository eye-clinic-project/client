/** /doctor/analyses/new?patient=<id> — upload a fundus image. `patient` preselects the patient. */

import { pageMetadata } from "@/lib/i18n/metadata"
import { single, type SearchParams } from "@/lib/search-params"

import { NewAnalysisForm } from "./new-analysis-form"

export const generateMetadata = pageMetadata("newAnalysis")

export default async function NewAnalysisPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  return <NewAnalysisForm initialPatientId={single(params.patient) ?? ""} />
}
