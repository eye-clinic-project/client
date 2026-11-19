import type { Conversation, MessagePage } from "@/types/api"
import { api } from "./api"

export const chatApi = api.injectEndpoints({
  endpoints: (build) => ({
    listConversations: build.query<Conversation[], void>({
      query: () => "/chat/conversations",
      providesTags: [{ type: "Conversation", id: "LIST" }],
    }),
    startConversation: build.mutation<Conversation, { participantId: string }>({
      query: (body) => ({ url: "/chat/conversations", method: "POST", body }),
      invalidatesTags: [{ type: "Conversation", id: "LIST" }],
    }),
    listMessages: build.query<
      MessagePage,
      { conversationId: string; before?: string; limit?: number }
    >({
      query: ({ conversationId, ...params }) => ({
        url: `/chat/conversations/${conversationId}/messages`,
        params,
      }),
      providesTags: (_result, _error, { conversationId }) => [
        { type: "Message", id: conversationId },
      ],
    }),
  }),
})

export const {
  useListConversationsQuery,
  useStartConversationMutation,
  useListMessagesQuery,
} = chatApi
