import { pageMetadata } from "@/lib/i18n/metadata"
import { ReportEditor } from "./report-editor"

export const generateMetadata = pageMetadata("report")

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ReportEditor id={id} />
}
