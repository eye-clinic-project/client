/** /doctor/verification — submit the medical license and follow the admin's review. */

import { pageMetadata } from "@/lib/i18n/metadata"

import { VerificationView } from "./verification-view"

export const generateMetadata = pageMetadata("verification")

export default function VerificationPage() {
  return <VerificationView />
}
