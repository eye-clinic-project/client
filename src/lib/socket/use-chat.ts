"use client"

/**
 * Chat actions for components: join/leave a conversation, send messages,
 * typing indicator and read receipts. Connection itself is managed by ChatSocketProvider.
 */

import { useCallback, useMemo } from "react"

import { useChatActions, useChatState } from "@/contexts/chat-context"

import {
  chatSocket,
  isWsError,
  wsErrorMessage,
  type SendMessagePayload,
  type WsError,
} from "./chat.socket"

const ACK_TIMEOUT_MS = 10_000

/** Turns an error ack into a thrown Error so callers can use try/catch. */
function ensureOk<T>(response: T | WsError): T {
  if (isWsError(response)) throw new Error(wsErrorMessage(response))
  return response
}

const withTimeout = () => chatSocket().timeout(ACK_TIMEOUT_MS)

export function useChat(senderId: string | undefined) {
  const actions = useChatActions()
  const { status } = useChatState()

  const join = useCallback(
    async (conversationId: string) => {
      actions.conversationOpened(conversationId)
      ensureOk(
        await withTimeout().emitWithAck("join_conversation", { conversationId })
      )
    },
    [actions]
  )

  const leave = useCallback(
    async (conversationId: string) => {
      actions.conversationOpened(null)
      ensureOk(
        await withTimeout().emitWithAck("leave_conversation", {
          conversationId,
        })
      )
    },
    [actions]
  )

  const send = useCallback(
    // Optimistic send: show the message right away with a temporary clientId,
    // then replace it with the server's copy (or remove it if sending fails).
    async ({
      conversationId,
      message,
      attachments,
    }: Omit<SendMessagePayload, "clientId">) => {
      const clientId = crypto.randomUUID()
      actions.messageQueued({
        _id: clientId,
        clientId,
        conversation: conversationId,
        sender: senderId ?? "",
        message: message ?? "",
        attachments: [],
        readBy: [],
        createdAt: new Date().toISOString(),
      })
      try {
        const response = ensureOk(
          await withTimeout().emitWithAck("send_message", {
            conversationId,
            message,
            attachments,
            clientId,
          })
        )
        actions.messageReceived(response.message)
        return response.message
      } catch (error) {
        actions.messageFailed(clientId)
        throw error
      }
    },
    [actions, senderId]
  )

  // Fire-and-forget: no need to wait for typing/read acks.
  const setTyping = useCallback((conversationId: string, isTyping: boolean) => {
    chatSocket().emit("typing", { conversationId, isTyping }, () => {})
  }, [])

  const markRead = useCallback((conversationId: string, messageId?: string) => {
    chatSocket().emit("read", { conversationId, messageId }, () => {})
  }, [])

  return useMemo(
    () => ({ status, join, leave, send, setTyping, markRead }),
    [status, join, leave, send, setTyping, markRead]
  )
}
