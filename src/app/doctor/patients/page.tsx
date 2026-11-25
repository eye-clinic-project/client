/**
 * /doctor/patients — my patients, and search to assign existing ones.
 * `?search=` prefills the search; `?add=1` opens the "add patient" panel.
 */

import { pageMetadata } from "@/lib/i18n/metadata"
import { single, type SearchParams } from "@/lib/search-params"

import { PatientsView } from "./patients-view"

export const generateMetadata = pageMetadata("patients")

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  return (
    <PatientsView
      initialSearch={single(params.search) ?? ""}
      initialAdd={single(params.add) === "1"}
    />
  )
}
