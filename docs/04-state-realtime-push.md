# 4. Client State, Realtime Chat & Push Notifications

## 4.1 Client state (React Context)

Server data lives in the query cache (doc 3). The rest is React Context, all
mounted once in `AppProviders` (`UiProvider → QueryProvider → ChatProvider`).

### `UiProvider` — `src/contexts/ui-context.tsx` → `useUi()`
| Field | Purpose |
|-------|---------|
| `language` / `setLanguage` | `en`/`ar`; initial value from the server locale. `getLanguage()` (stable, ref-backed) is what the request layer reads for `x-language`. |
| `pushPermission` / `setPushPermission` | Browser permission or `"unsupported"` |
| `pushSubscribed` / `setPushSubscribed` | Device token registered with backend |

### `ChatProvider` — `src/contexts/chat-context.tsx`
`useChatState()` returns the state; `useChatActions()` returns stable actions
(`socketStatusChanged`, `conversationOpened`, `messageQueued`, `messageFailed`,
`messageReceived`, `typingChanged`, `messagesRead`, `reset`, `getState`). They are
separate contexts so action-only users (the socket provider) don't re-render on
every chat event.

| Field | Purpose |
|-------|---------|
| `status` | socket state: `idle/connecting/connected/disconnected/error` |
| `activeConversationId` | re-joined automatically after reconnect |
| `liveMessages[conversationId]` | messages received over the socket (deduped by `_id`) |
| `pending[clientId]` | optimistic messages awaiting ack |
| `typing[conversationId]` | user IDs currently typing |

History comes from the `useListMessagesQuery` hook; live messages are merged on top in
the chat UI (`components/chat/`).

**Rule:** server data lives in the query cache, not in contexts. Add context state
only for what the backend does not own (UI prefs, socket state, optimistic items).

## 4.2 Realtime chat (Socket.IO)

Files: `src/lib/socket/chat.socket.ts`, `src/lib/socket/chat-socket-provider.tsx`,
`src/lib/socket/use-chat.ts`.

- **Singleton** `chatSocket()` → `io(`${socketUrl}/chat`, { autoConnect: false,
  transports: ["websocket"], auth: cb => cb({ token: tokenStore.get() }) })`.
  The `auth` callback reads the token on every (re)connect, so it is always fresh.
- **`ChatSocketProvider`** (mounted in doctor and patient layouts):
  - wires listeners → calls chat context actions,
  - `new_message` / `read` also invalidate `Conversation/LIST` (unread badges),
  - `exception` with `statusCode 401` → `tokenStore.forceRefresh()`,
  - subscribes to `tokenStore`: reconnects when the token changes, disconnects
    when it is cleared,
  - on unmount: disconnects and resets chat state.
- **`useChat(senderId)`** returns `join`, `leave`, `send`, `setTyping`,
  `markRead`. `send` creates a `clientId`, queues an optimistic message, and waits
  for the ack (10 s timeout). On failure it removes the pending message and throws.

Event contract (typed in `chat.socket.ts`):

| Direction | Event | Payload |
|-----------|-------|---------|
| client → server | `join_conversation`, `leave_conversation` | `{ conversationId }` |
| client → server | `send_message` | `{ conversationId, message?, clientId?, attachments? }` |
| client → server | `typing` | `{ conversationId, isTyping }` |
| client → server | `read` | `{ conversationId, messageId? }` |
| server → client | `new_message` | `ChatMessage` |
| server → client | `typing` / `read` | `TypingEvent` / `ReadEvent` |
| server → client | `exception` | `WsError` |

To add an event: type it in `ServerToClientEvents` / `ClientToServerEvents`, handle
it in the provider (remember `off` in cleanup), expose it via `useChat`.

## 4.3 Push notifications (Firebase Cloud Messaging)

Enabled only when the `NEXT_PUBLIC_FIREBASE_*` env vars (including `VAPID_KEY`)
are set; otherwise `publicEnv.firebase` is `null` and push is reported as
`unsupported`.

| Piece | File | Job |
|-------|------|-----|
| Init | `lib/firebase.ts` | Lazy `initializeApp`, `firebaseMessaging()` (null on SSR/unsupported) |
| Registration | `components/layout/push-registrar.tsx` → `usePushRegistration()` | If permission already granted and not opted out: register SW, get token, `PUT /user/me/devices` |
| Toggle | `usePushNotifications()` (`enable` / `disable`) | Used by settings and `push-prompt.tsx` |
| Foreground | `onMessage` in `usePushRegistration` | Invalidates related tags + shows a toast |
| Background | `public/firebase-messaging-sw.js` | Shows a system notification when no window is focused; click opens `/open?link=…` |

`localStorage` keys: `retinacare.deviceToken` (avoid re-registering) and
`retinacare.pushOptOut`.

## 4.4 Notification deep links

Backend notifications carry an API-style `link` (e.g. `/analysis/123`).
`lib/notification-link.ts → notificationRoute(role, link, type, resourceId)` turns
it into a client route for the current role, with a per-type fallback.

`app/open/page.tsx` is the landing page for push clicks: it signs the user in if
needed (keeping `callbackUrl`) and then redirects with `notificationRoute`.

When the backend adds a new link shape or notification type, add a `RULES` entry
and/or a `fallback` mapping there.

Next: [5. Routing & features →](./05-routing-and-features.md)
