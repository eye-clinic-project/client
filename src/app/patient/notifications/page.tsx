/** /patient/notifications — notifications inbox. */

import { NotificationsView } from "@/components/notifications/notifications-view"
import { pageMetadata } from "@/lib/i18n/metadata"

export const generateMetadata = pageMetadata("notifications")

export default function NotificationsPage() {
  return <NotificationsView role="patient" />
}
