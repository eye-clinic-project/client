/** /patient/appointments/[id] — one visit, with cancel/reschedule requests. */

import { pageMetadata } from "@/lib/i18n/metadata"

import { VisitDetail } from "./visit-detail"

export const generateMetadata = pageMetadata("visit")

export default async function VisitPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <VisitDetail id={id} />
}
