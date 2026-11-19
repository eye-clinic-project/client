"use client"

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

  useEffect(() => {
    if (
      session?.error === "RefreshTokenError" ||
      session?.error === "GoogleSignInError"
    ) {
      tokenStore.clear()
      void signOut({ redirectTo: "/sign-in?expired=1" })
    }
  }, [session?.error])

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
