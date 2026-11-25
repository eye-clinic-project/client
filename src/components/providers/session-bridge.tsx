"use client"

/**
 * Connects the Auth.js session (React) to tokenStore (plain module).
 *
 * - Gives tokenStore the `update()` function so non-React code can refresh.
 * - Copies every new session's access token into tokenStore.
 * - Signs out when the session reports a fatal error.
 * - Schedules a refresh a little before the access token expires.
 * Renders nothing.
 */

import { signOut, useSession } from "next-auth/react"
import { useEffect } from "react"

import { REFRESH_SKEW_MS } from "@/lib/auth/constants"
import { tokenStore } from "@/lib/auth/token-store"
import type { SessionUpdate } from "@/validation/session.schema"

export function SessionBridge() {
  const { data: session, update } = useSession()

  useEffect(() => {
    tokenStore.bind((data?: SessionUpdate) => update(data))
  }, [update])

  useEffect(() => {
    tokenStore.sync(session)
  }, [session])

  // Refresh token is dead or Google sign-up failed: the session can't recover.
  useEffect(() => {
    if (
      session?.error === "RefreshTokenError" ||
      session?.error === "GoogleSignInError"
    ) {
      tokenStore.clear()
      void signOut({ redirectTo: "/sign-in?expired=1" })
    }
  }, [session?.error])

  // Proactive refresh, so users rarely hit a 401 at all.
  const expiresAt = session?.accessTokenExpiresAt
  useEffect(() => {
    if (!expiresAt) return
    const delay = Math.max(
      expiresAt - REFRESH_SKEW_MS + 5_000 - Date.now(),
      5_000
    )
    const timer = window.setTimeout(() => void tokenStore.ensureFresh(), delay)
    return () => window.clearTimeout(timer)
  }, [expiresAt])

  return null
}
