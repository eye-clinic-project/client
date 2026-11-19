"use client"

import { useCallback, useMemo } from "react"

import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import {
  conversationOpened,
  messageFailed,
  messageQueued,
  messageReceived,
} from "@/redux/slices/chat.slice"
import {
  chatSocket,
  isWsError,
  wsErrorMessage,
  type SendMessagePayload,
  type WsError,
} from "./chat.socket"

const ACK_TIMEOUT_MS = 10_000

function ensureOk<T>(response: T | WsError): T {
  if (isWsError(response)) throw new Error(wsErrorMessage(response))
  return response
}

const withTimeout = () => chatSocket().timeout(ACK_TIMEOUT_MS)

export function useChat(senderId: string | undefined) {
  const dispatch = useAppDispatch()
  const status = useAppSelector((state) => state.chat.status)

  const join = useCallback(
    async (conversationId: string) => {
      dispatch(conversationOpened(conversationId))
      ensureOk(
        await withTimeout().emitWithAck("join_conversation", { conversationId })
      )
    },
    [dispatch]
  )

  const leave = useCallback(
    async (conversationId: string) => {
      dispatch(conversationOpened(null))
      ensureOk(
        await withTimeout().emitWithAck("leave_conversation", {
          conversationId,
        })
      )
    },
    [dispatch]
  )

  const send = useCallback(
    async ({
      conversationId,
      message,
      attachments,
    }: Omit<SendMessagePayload, "clientId">) => {
      const clientId = crypto.randomUUID()
      dispatch(
        messageQueued({
          _id: clientId,
          clientId,
          conversation: conversationId,
          sender: senderId ?? "",
          message: message ?? "",
          attachments: [],
          readBy: [],
          createdAt: new Date().toISOString(),
        })
      )
      try {
        const response = ensureOk(
          await withTimeout().emitWithAck("send_message", {
            conversationId,
            message,
            attachments,
            clientId,
          })
        )
        dispatch(messageReceived(response.message))
        return response.message
      } catch (error) {
        dispatch(messageFailed(clientId))
        throw error
      }
    },
    [dispatch, senderId]
  )

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
