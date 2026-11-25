import type { Session } from "next-auth"

import type { SessionUpdate } from "@/validation/session.schema"

import { REFRESH_SKEW_MS } from "./constants"

/**
 * Client-side holder of the current access token.
 *
 * The token itself lives in the Auth.js session (refreshed on the server).
 * `SessionBridge` copies it here so non-React code (the request layer, file fetches,
 * the chat socket) can read it, and gives us `useSession().update` so we can
 * ask the server to refresh it.
 */

type SessionUpdater = (data?: SessionUpdate) => Promise<Session | null>
type TokenListener = (accessToken: string | undefined) => void

/**
 * Ask for a refresh slightly later than the server's own threshold, so when the
 * request reaches the `jwt` callback the token is surely inside its refresh window.
 */
const CLIENT_REFRESH_MARGIN_MS = REFRESH_SKEW_MS - 10_000

// ── State ────────────────────────────────────────────────────────────────────

let accessToken: string | undefined
let expiresAt = 0
let updateSession: SessionUpdater | null = null
let pendingRefresh: Promise<boolean> | null = null
const listeners = new Set<TokenListener>()

// ── Helpers ──────────────────────────────────────────────────────────────────

function usableToken(session: Session | null | undefined) {
  return session?.error === "RefreshTokenError"
    ? undefined
    : session?.accessToken
}

/** Takes the token from a session and notifies listeners if it changed. */
function applySession(session: Session | null | undefined) {
  const nextToken = usableToken(session)
  expiresAt = nextToken ? (session?.accessTokenExpiresAt ?? 0) : 0

  if (nextToken === accessToken) return
  accessToken = nextToken
  for (const listener of listeners) listener(accessToken)
}

function isExpiringSoon() {
  return Date.now() > expiresAt - CLIENT_REFRESH_MARGIN_MS
}

/**
 * Calls `update()` on the session. Concurrent callers share one call.
 * Resolves `true` when the session came back with a usable token.
 */
function requestSessionUpdate(data?: SessionUpdate): Promise<boolean> {
  if (!updateSession) return Promise.resolve(Boolean(accessToken))

  pendingRefresh ??= updateSession(data)
    .then((session) => {
      applySession(session)
      return Boolean(session?.accessToken) && !session?.error
    })
    .catch(() => false)
    .finally(() => {
      pendingRefresh = null
    })

  return pendingRefresh
}

// ── Public API ───────────────────────────────────────────────────────────────

export const tokenStore = {
  /** Current access token, or `undefined` when signed out. */
  get: () => accessToken,

  /** Replace the token with the one from this session. */
  sync: applySession,

  /** Register `useSession().update` (done once by `SessionBridge`). */
  bind(update: SessionUpdater) {
    updateSession = update
  },

  /** Be told when the token changes. Returns an unsubscribe function. */
  subscribe(listener: TokenListener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  /** Call before a request: waits for any refresh and refreshes if expiring. */
  async ensureFresh() {
    if (pendingRefresh) await pendingRefresh
    if (accessToken && isExpiringSoon()) await requestSessionUpdate()
  },

  /** Refresh now, e.g. after a 401. Resolves `true` on success. */
  forceRefresh: () => requestSessionUpdate({ kind: "refresh" }),

  /** Forget the token (sign-out). */
  clear() {
    applySession(null)
  },
}
