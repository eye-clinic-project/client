import { pageMetadata } from "@/lib/i18n/metadata"
import { VisitsView } from "./visits-view"

export const generateMetadata = pageMetadata("visits")

export default function VisitsPage() {
  return <VisitsView />
}
