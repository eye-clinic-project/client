"use client"

/**
 * Owns the chat socket connection for doctor and patient areas (mounted in their layouts).
 *
 * - Connects when there is an access token, reconnects when it changes,
 *   disconnects when it's cleared (sign-out).
 * - Feeds socket events into the chat context and refreshes the conversation list
 *   (unread counts) through query tags.
 * - Re-joins the open conversation after a reconnect.
 */

import { useEffect, type ReactNode } from "react"

import { useChatActions } from "@/contexts/chat-context"
import { tokenStore } from "@/lib/auth/token-store"
import { useQueryClient } from "@/lib/query/provider"
import type { ChatMessage } from "@/types/api"

import {
  chatSocket,
  type ReadEvent,
  type TypingEvent,
  type WsError,
} from "./chat.socket"

export function ChatSocketProvider({ children }: { children: ReactNode }) {
  const chat = useChatActions()
  const queryClient = useQueryClient()

  useEffect(() => {
    const socket = chatSocket()

    const onConnect = () => {
      chat.socketStatusChanged("connected")
      const active = chat.getState().activeConversationId
      if (active)
        socket.emit("join_conversation", { conversationId: active }, () => {})
    }
    const refreshConversations = () =>
      queryClient.invalidateTags([{ type: "Conversation", id: "LIST" }])
    const onDisconnect = () => chat.socketStatusChanged("disconnected")
    const onConnectError = () => chat.socketStatusChanged("error")
    const onMessage = (message: ChatMessage) => {
      chat.messageReceived(message)
      refreshConversations()
    }
    const onTyping = (event: TypingEvent) => chat.typingChanged(event)
    const onRead = (event: ReadEvent) => {
      chat.messagesRead(event)
      refreshConversations()
    }
    // Server says our token is invalid → refresh it; the token change triggers a reconnect.
    const onException = (error: WsError) => {
      if (error.statusCode === 401) void tokenStore.forceRefresh()
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("connect_error", onConnectError)
    socket.on("new_message", onMessage)
    socket.on("typing", onTyping)
    socket.on("read", onRead)
    socket.on("exception", onException)

    // (Re)connect with a new token, or stay disconnected when signed out.
    const connectWith = (token: string | undefined) => {
      if (socket.connected || socket.active) socket.disconnect()
      if (!token) return
      chat.socketStatusChanged("connecting")
      socket.connect()
    }

    connectWith(tokenStore.get())
    const unsubscribe = tokenStore.subscribe(connectWith)

    return () => {
      unsubscribe()
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("connect_error", onConnectError)
      socket.off("new_message", onMessage)
      socket.off("typing", onTyping)
      socket.off("read", onRead)
      socket.off("exception", onException)
      socket.disconnect()
      chat.reset()
    }
  }, [chat, queryClient])

  return children
}
