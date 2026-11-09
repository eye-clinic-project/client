import { apiClient } from "./api-client"
import type { Conversation, Message, MessagesPage } from "@/lib/api-types"

export const chatService = {
  list: () => apiClient<Conversation[]>("/conversations"),

  /** Opens (or returns) the conversation with an assigned doctor or patient. */
  start: (participantId: string) =>
    apiClient<Conversation>("/conversations", { method: "POST", body: { participantId } }),

  messages: (conversationId: string, before?: string) =>
    apiClient<MessagesPage>(`/conversations/${conversationId}/messages`, { query: { before, limit: 50 } }),

  send: (conversationId: string, message: string) =>
    apiClient<Message>(`/conversations/${conversationId}/messages`, { method: "POST", body: { message } }),

  markRead: (conversationId: string) =>
    apiClient<{ updated: number }>(`/conversations/${conversationId}/read`, { method: "PATCH" }),
}
