"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

import type { Me, UserRole } from "@/lib/api-types"
import { getStoredAccessToken } from "@/lib/api-config"
import { authService } from "@/service/auth.service"
import { setSessionExpiredHandler } from "@/service/api-client"

type SessionState = {
  me: Me | null
  /** True until the first /auth/me check finishes. */
  loading: boolean
  refresh: () => Promise<Me | null>
  logout: () => Promise<void>
}

const SessionContext = createContext<SessionState | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!getStoredAccessToken()) {
      setMe(null)
      setLoading(false)
      return null
    }
    try {
      const user = await authService.me()
      setMe(user)
      return user
    } catch {
      setMe(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setMe(null)
    router.replace("/login")
  }, [router])

  useEffect(() => {
    let cancelled = false
    const token = getStoredAccessToken()
    void (async () => {
      const user = await (token ? authService.me().catch(() => null) : Promise.resolve(null))
      if (cancelled) return
      setMe(user)
      setLoading(false)
    })()
    setSessionExpiredHandler(() => {
      setMe(null)
      router.replace("/login?expired=1")
    })
    return () => {
      cancelled = true
      setSessionExpiredHandler(null)
    }
  }, [router])

  const value = useMemo(() => ({ me, loading, refresh, logout }), [me, loading, refresh, logout])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error("useSession must be used inside SessionProvider")
  return ctx
}

/** Path of the dashboard for a role. */
export function homeFor(role?: UserRole | null) {
  return role === "doctor" ? "/doctor" : role === "patient" ? "/patient" : "/login"
}

/**
 * Redirects to /login without a session, and to the user's own dashboard when the
 * signed-in role does not match. Returns the user once it is allowed to render.
 */
export function useRequireRole(role: UserRole): Me | null {
  const { me, loading } = useSession()
  const router = useRouter()
  useEffect(() => {
    if (loading) return
    if (!me) router.replace("/login")
    else if (me.role !== role) router.replace(homeFor(me.role))
  }, [loading, me, role, router])
  return me && me.role === role ? me : null
}
