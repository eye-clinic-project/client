/**
 * /doctor/messages — chat with patients.
 * `?c=<conversationId>` opens a conversation; `?with=<userId>` starts/opens one with that user.
 */

import { ChatView } from "@/components/chat/chat-view"
import { requireRole } from "@/lib/auth/require-role"
import { pageMetadata } from "@/lib/i18n/metadata"
import { single, type SearchParams } from "@/lib/search-params"

export const generateMetadata = pageMetadata("messages")

export default async function DoctorMessagesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const [profile, params] = await Promise.all([
    requireRole("doctor"),
    searchParams,
  ])
  return (
    <ChatView
      role="doctor"
      selfId={profile.id}
      basePath="/doctor/messages"
      initialConversationId={single(params.c)}
      startWithUserId={single(params.with)}
    />
  )
}
