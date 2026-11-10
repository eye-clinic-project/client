"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

import type { Me, UserRole } from "@/lib/api-types"
import { getStoredAccessToken } from "@/lib/api-config"
import { authService } from "@/service/auth.service"
import { setApprovalRequiredHandler, setSessionExpiredHandler } from "@/service/api-client"

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
    // The license was rejected or is still under review: reload the status and show the waiting page.
    setApprovalRequiredHandler(() => {
      void authService
        .me()
        .then(setMe)
        .catch(() => null)
      router.replace("/doctor/pending")
    })
    return () => {
      cancelled = true
      setSessionExpiredHandler(null)
      setApprovalRequiredHandler(null)
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

/** True for doctors whose license an admin has approved (and for every non-doctor). */
export function isApproved(me: Me | null | undefined) {
  return !!me && (me.role !== "doctor" || me.verification?.status === "approved")
}

/** Path of the signed-in user's home: their dashboard, or the license waiting page for unapproved doctors. */
export function homeFor(me: Me | null | undefined) {
  if (!me) return "/login"
  if (me.role === "admin") return "/admin"
  if (me.role === "patient") return "/patient"
  if (me.role === "doctor") return isApproved(me) ? "/doctor" : "/doctor/pending"
  return "/login"
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
    else if (me.role !== role) router.replace(homeFor(me))
  }, [loading, me, role, router])
  return me && me.role === role ? me : null
}
