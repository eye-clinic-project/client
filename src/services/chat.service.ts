/**
 * Chat history over REST. Live messages, typing and read receipts come over the
 * socket instead (socket/), and are merged on top of this history in the UI.
 */

import { defineMutation, defineQuery } from "@/lib/query/define"
import type { Conversation, MessagePage } from "@/types/api"

export const useListConversationsQuery = defineQuery<Conversation[], void>({
  name: "listConversations",
  query: () => "/chat/conversations",
  providesTags: [{ type: "Conversation", id: "LIST" }],
})

export const useStartConversationMutation = defineMutation<
  Conversation,
  { participantId: string }
>({
  query: (body) => ({ url: "/chat/conversations", method: "POST", body }),
  invalidatesTags: [{ type: "Conversation", id: "LIST" }],
})

// Paged history, newest first: pass `before` (a message id/date) to load older ones.
export const useListMessagesQuery = defineQuery<
  MessagePage,
  { conversationId: string; before?: string; limit?: number }
>({
  name: "listMessages",
  query: ({ conversationId, ...params }) => ({
    url: `/chat/conversations/${conversationId}/messages`,
    params,
  }),
  providesTags: (_data, { conversationId }) => [
    { type: "Message", id: conversationId },
  ],
})
