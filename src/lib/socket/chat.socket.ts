/**
 * Socket.IO client for realtime chat (namespace `/chat`) and its typed event contract.
 *
 * One shared socket for the whole tab. It does not auto-connect:
 * ChatSocketProvider connects it when there is a token. The token is read on
 * every (re)connect, so reconnects always use the latest one.
 */

import { io, type Socket } from "socket.io-client"

import { tokenStore } from "@/lib/auth/token-store"
import { publicEnv } from "@/lib/env"
import type { ChatMessage } from "@/types/api"

/** Error shape the server sends in acks and `exception` events. */
export interface WsError {
  status: "error"
  event?: string
  statusCode?: number
  message: string | string[]
}

type Ack<T> = (response: T | WsError) => void

export interface TypingEvent {
  conversationId: string
  userId: string
  isTyping: boolean
}

export interface ReadEvent {
  conversationId: string
  userId: string
  upTo: string
  count: number
}

export interface SendMessagePayload {
  conversationId: string
  message?: string
  clientId?: string
  attachments?: { name?: string; data: ArrayBuffer }[]
}

/** Events the server pushes to us. */
interface ServerToClientEvents {
  new_message: (message: ChatMessage) => void
  typing: (event: TypingEvent) => void
  read: (event: ReadEvent) => void
  exception: (error: WsError) => void
}

/** Events we send. Each takes an ack callback with the server's answer. */
interface ClientToServerEvents {
  join_conversation: (
    payload: { conversationId: string },
    ack: Ack<{ status: "ok"; conversationId: string }>
  ) => void
  leave_conversation: (
    payload: { conversationId: string },
    ack: Ack<{ status: "ok"; conversationId: string }>
  ) => void
  send_message: (
    payload: SendMessagePayload,
    ack: Ack<{ status: "ok"; message: ChatMessage }>
  ) => void
  typing: (
    payload: { conversationId: string; isTyping: boolean },
    ack: Ack<{ status: "ok" }>
  ) => void
  read: (
    payload: { conversationId: string; messageId?: string },
    ack: Ack<{ status: "ok"; count: number; upTo: string }>
  ) => void
}

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socket: ChatSocket | null = null

/** The shared socket, created on first use. */
export function chatSocket(): ChatSocket {
  socket ??= io(`${publicEnv.socketUrl}/chat`, {
    autoConnect: false,
    transports: ["websocket"],
    withCredentials: true,
    auth: (callback) => callback({ token: tokenStore.get() }),
  })
  return socket
}

export function isWsError(value: unknown): value is WsError {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { status?: unknown }).status === "error"
  )
}

export function wsErrorMessage(error: WsError): string {
  return Array.isArray(error.message)
    ? (error.message[0] ?? "Request failed")
    : error.message
}
