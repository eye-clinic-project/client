"use client"

/**
 * Live chat state fed by the socket (see
 * lib/socket/chat-socket-provider.tsx).
 *
 * Message history comes from the REST queries; this only keeps what arrived
 * since: new messages, optimistic "sending…" messages, typing users and read receipts.
 *
 * State and actions live in separate contexts so components that only send
 * actions (the socket provider) don't re-render on every chat event.
 */

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react"

import type { ChatMessage } from "@/types/api"

export type SocketStatus =
  "idle" | "connecting" | "connected" | "disconnected" | "error"

/**
 * - liveMessages: per conversation, messages received over the socket
 * - pending:      optimistic messages by clientId, removed when the server confirms
 * - typing:       per conversation, ids of users currently typing
 */
export interface ChatState {
  status: SocketStatus
  activeConversationId: string | null
  liveMessages: Record<string, ChatMessage[]>
  typing: Record<string, string[]>
  pending: Record<string, ChatMessage>
}

type ChatAction =
  | { type: "socketStatusChanged"; status: SocketStatus }
  | { type: "conversationOpened"; conversationId: string | null }
  | { type: "messageQueued"; message: ChatMessage & { clientId: string } }
  | { type: "messageFailed"; clientId: string }
  | { type: "messageReceived"; message: ChatMessage }
  | {
      type: "typingChanged"
      conversationId: string
      userId: string
      isTyping: boolean
    }
  | {
      type: "messagesRead"
      conversationId: string
      userId: string
      upTo: string
    }
  | { type: "reset" }

const initialState: ChatState = {
  status: "idle",
  activeConversationId: null,
  liveMessages: {},
  typing: {},
  pending: {},
}

function withoutKey<T>(record: Record<string, T>, key: string) {
  if (!(key in record)) return record
  const rest = { ...record }
  delete rest[key]
  return rest
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "socketStatusChanged":
      return { ...state, status: action.status }
    case "conversationOpened":
      return { ...state, activeConversationId: action.conversationId }
    case "messageQueued":
      return {
        ...state,
        pending: {
          ...state.pending,
          [action.message.clientId]: action.message,
        },
      }
    case "messageFailed":
      return { ...state, pending: withoutKey(state.pending, action.clientId) }
    // Server-confirmed message: drop its optimistic copy, add it once (dedupe by _id).
    case "messageReceived": {
      const { message } = action
      const pending = message.clientId
        ? withoutKey(state.pending, message.clientId)
        : state.pending
      const list = state.liveMessages[message.conversation] ?? []
      const liveMessages = list.some((existing) => existing._id === message._id)
        ? state.liveMessages
        : { ...state.liveMessages, [message.conversation]: [...list, message] }
      return { ...state, pending, liveMessages }
    }
    // Add/remove a user from the conversation's "is typing" list.
    case "typingChanged": {
      const current = new Set(state.typing[action.conversationId] ?? [])
      if (action.isTyping) current.add(action.userId)
      else current.delete(action.userId)
      return {
        ...state,
        typing: { ...state.typing, [action.conversationId]: [...current] },
      }
    }
    // Someone read the conversation up to `upTo`: mark older messages as read by them.
    case "messagesRead": {
      const { conversationId, userId, upTo } = action
      const list = state.liveMessages[conversationId]
      if (!list) return state
      const cutoff = new Date(upTo).getTime()
      return {
        ...state,
        liveMessages: {
          ...state.liveMessages,
          [conversationId]: list.map((message) =>
            new Date(message.createdAt).getTime() <= cutoff &&
            !message.readBy.includes(userId)
              ? { ...message, readBy: [...message.readBy, userId] }
              : message
          ),
        },
      }
    }
    case "reset":
      return initialState
  }
}

export interface ChatActions {
  socketStatusChanged: (status: SocketStatus) => void
  conversationOpened: (conversationId: string | null) => void
  messageQueued: (message: ChatMessage & { clientId: string }) => void
  messageFailed: (clientId: string) => void
  messageReceived: (message: ChatMessage) => void
  typingChanged: (event: {
    conversationId: string
    userId: string
    isTyping: boolean
  }) => void
  messagesRead: (event: {
    conversationId: string
    userId: string
    upTo: string
  }) => void
  reset: () => void
  /** Latest state without subscribing to it (for socket event handlers). */
  getState: () => ChatState
}

const ChatStateContext = createContext<ChatState | null>(null)
const ChatActionsContext = createContext<ChatActions | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const stateRef = useRef(state)

  const actions = useMemo<ChatActions>(() => {
    // Mirror every action into stateRef, so getState() is never one render behind.
    const send = (action: ChatAction) => {
      stateRef.current = chatReducer(stateRef.current, action)
      dispatch(action)
    }
    return {
      socketStatusChanged: (status) =>
        send({ type: "socketStatusChanged", status }),
      conversationOpened: (conversationId) =>
        send({ type: "conversationOpened", conversationId }),
      messageQueued: (message) => send({ type: "messageQueued", message }),
      messageFailed: (clientId) => send({ type: "messageFailed", clientId }),
      messageReceived: (message) => send({ type: "messageReceived", message }),
      typingChanged: (event) => send({ type: "typingChanged", ...event }),
      messagesRead: (event) => send({ type: "messagesRead", ...event }),
      reset: () => send({ type: "reset" }),
      getState: () => stateRef.current,
    }
  }, [])

  return (
    <ChatActionsContext.Provider value={actions}>
      <ChatStateContext.Provider value={state}>
        {children}
      </ChatStateContext.Provider>
    </ChatActionsContext.Provider>
  )
}

export function useChatState(): ChatState {
  const value = useContext(ChatStateContext)
  if (!value) throw new Error("useChatState must be used inside ChatProvider")
  return value
}

export function useChatActions(): ChatActions {
  const value = useContext(ChatActionsContext)
  if (!value) throw new Error("useChatActions must be used inside ChatProvider")
  return value
}
