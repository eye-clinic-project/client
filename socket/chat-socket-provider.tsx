"use client"

import { useEffect, type ReactNode } from "react"

import { tokenStore } from "@/lib/auth/token-store"
import { useAppDispatch, useAppStore } from "@/redux/hooks"
import {
  chatReset,
  messageReceived,
  messagesRead,
  socketStatusChanged,
  typingChanged,
} from "@/redux/slices/chat.slice"
import { api } from "@/service/api"
import {
  chatSocket,
  type ReadEvent,
  type TypingEvent,
  type WsError,
} from "./chat.socket"
import type { ChatMessage } from "@/types/api"

export function ChatSocketProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  const store = useAppStore()

  useEffect(() => {
    const socket = chatSocket()

    const onConnect = () => {
      dispatch(socketStatusChanged("connected"))
      const active = store.getState().chat.activeConversationId
      if (active)
        socket.emit("join_conversation", { conversationId: active }, () => {})
    }
    const onDisconnect = () => dispatch(socketStatusChanged("disconnected"))
    const onConnectError = () => dispatch(socketStatusChanged("error"))
    const onMessage = (message: ChatMessage) => {
      dispatch(messageReceived(message))
      dispatch(api.util.invalidateTags([{ type: "Conversation", id: "LIST" }]))
    }
    const onTyping = (event: TypingEvent) => dispatch(typingChanged(event))
    const onRead = (event: ReadEvent) => {
      dispatch(messagesRead(event))
      dispatch(api.util.invalidateTags([{ type: "Conversation", id: "LIST" }]))
    }
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

    const connectWith = (token: string | undefined) => {
      if (socket.connected || socket.active) socket.disconnect()
      if (!token) return
      dispatch(socketStatusChanged("connecting"))
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
      dispatch(chatReset())
    }
  }, [dispatch, store])

  return children
}
