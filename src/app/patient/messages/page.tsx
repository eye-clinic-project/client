/**
 * /patient/messages — chat with my doctors.
 * `?c=<conversationId>` opens a conversation; `?doctor=<id>` (or `?with=`) starts/opens one with that doctor.
 */

import { ChatView } from "@/components/chat/chat-view"
import { requireRole } from "@/lib/auth/require-role"
import { pageMetadata } from "@/lib/i18n/metadata"
import { single, type SearchParams } from "@/lib/search-params"

export const generateMetadata = pageMetadata("messages")

export default async function PatientMessagesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const [profile, params] = await Promise.all([
    requireRole("patient"),
    searchParams,
  ])
  return (
    <ChatView
      role="patient"
      selfId={profile.id}
      basePath="/patient/messages"
      initialConversationId={single(params.c)}
      startWithUserId={single(params.doctor) ?? single(params.with)}
    />
  )
}
