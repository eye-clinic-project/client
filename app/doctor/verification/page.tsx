import { pageMetadata } from "@/lib/i18n/metadata"
import { VerificationView } from "./verification-view"

export const generateMetadata = pageMetadata("verification")

export default function VerificationPage() {
  return <VerificationView />
}
