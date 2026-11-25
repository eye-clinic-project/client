import type { Session } from "next-auth"

import type { SessionUpdate } from "@/validation/session.schema"
import { REFRESH_SKEW_MS } from "./constants"

type Updater = (data?: SessionUpdate) => Promise<Session | null>
type Listener = (accessToken: string | undefined) => void

let accessToken: string | undefined
let expiresAt = 0
let updater: Updater | null = null
let inflight: Promise<boolean> | null = null
const listeners = new Set<Listener>()

function apply(session: Session | null | undefined) {
  const next =
    session?.error === "RefreshTokenError" ? undefined : session?.accessToken
  expiresAt = next ? (session?.accessTokenExpiresAt ?? 0) : 0
  if (next === accessToken) return
  accessToken = next
  for (const listener of listeners) listener(accessToken)
}

function run(data?: SessionUpdate): Promise<boolean> {
  if (!updater) return Promise.resolve(Boolean(accessToken))
  inflight ??= updater(data)
    .then((session) => {
      apply(session)
      return Boolean(session?.accessToken) && !session?.error
    })
    .catch(() => false)
    .finally(() => {
      inflight = null
    })
  return inflight
}

export const tokenStore = {
  get: () => accessToken,
  expiresAt: () => expiresAt,
  sync: apply,
  bind(update: Updater) {
    updater = update
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  async ensureFresh() {
    if (inflight) await inflight
    if (accessToken && Date.now() > expiresAt - REFRESH_SKEW_MS + 10_000)
      await run()
  },
  forceRefresh: () => run({ kind: "refresh" }),
  clear() {
    apply(null)
  },
}
