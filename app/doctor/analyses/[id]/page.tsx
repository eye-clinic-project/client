import { pageMetadata } from "@/lib/i18n/metadata"
import { AnalysisReview } from "./analysis-review"

export const generateMetadata = pageMetadata("analysis")

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AnalysisReview id={id} />
}
