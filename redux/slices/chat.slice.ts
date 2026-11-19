import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import type { ChatMessage } from "@/types/api"

export type SocketStatus =
  "idle" | "connecting" | "connected" | "disconnected" | "error"

interface ChatState {
  status: SocketStatus
  activeConversationId: string | null
  liveMessages: Record<string, ChatMessage[]>
  typing: Record<string, string[]>
  pending: Record<string, ChatMessage>
}

const initialState: ChatState = {
  status: "idle",
  activeConversationId: null,
  liveMessages: {},
  typing: {},
  pending: {},
}

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    socketStatusChanged(state, action: PayloadAction<SocketStatus>) {
      state.status = action.payload
    },
    conversationOpened(state, action: PayloadAction<string | null>) {
      state.activeConversationId = action.payload
    },
    messageQueued(
      state,
      action: PayloadAction<ChatMessage & { clientId: string }>
    ) {
      state.pending[action.payload.clientId] = action.payload
    },
    messageFailed(state, action: PayloadAction<string>) {
      delete state.pending[action.payload]
    },
    messageReceived(state, action: PayloadAction<ChatMessage>) {
      const message = action.payload
      if (message.clientId) delete state.pending[message.clientId]
      const list = (state.liveMessages[message.conversation] ??= [])
      if (!list.some((existing) => existing._id === message._id))
        list.push(message)
    },
    typingChanged(
      state,
      action: PayloadAction<{
        conversationId: string
        userId: string
        isTyping: boolean
      }>
    ) {
      const { conversationId, userId, isTyping } = action.payload
      const current = new Set(state.typing[conversationId] ?? [])
      if (isTyping) current.add(userId)
      else current.delete(userId)
      state.typing[conversationId] = [...current]
    },
    messagesRead(
      state,
      action: PayloadAction<{
        conversationId: string
        userId: string
        upTo: string
      }>
    ) {
      const { conversationId, userId, upTo } = action.payload
      const cutoff = new Date(upTo).getTime()
      for (const message of state.liveMessages[conversationId] ?? []) {
        if (
          new Date(message.createdAt).getTime() <= cutoff &&
          !message.readBy.includes(userId)
        ) {
          message.readBy.push(userId)
        }
      }
    },
    chatReset() {
      return initialState
    },
  },
})

export const {
  socketStatusChanged,
  conversationOpened,
  messageQueued,
  messageFailed,
  messageReceived,
  typingChanged,
  messagesRead,
  chatReset,
} = chatSlice.actions
