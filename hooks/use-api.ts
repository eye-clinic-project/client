"use client"

import { useCallback, useEffect, useRef, useState, type DependencyList } from "react"

import { RateLimitError } from "@/service/api-client"

type AsyncState<T> = {
  data: T | undefined
  error: unknown
  loading: boolean
  reload: () => Promise<void>
  setData: (value: T | ((prev: T | undefined) => T)) => void
}

/** Loads data on mount and whenever `deps` change. Pass `null` as loader to skip. */
export function useApi<T>(loader: (() => Promise<T>) | null, deps: DependencyList): AsyncState<T> {
  const [data, setDataState] = useState<T>()
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(!!loader)
  const loaderRef = useRef(loader)
  const run = useRef(0)

  // Keep the latest loader without re-running the fetch effect (runs before it).
  useEffect(() => {
    loaderRef.current = loader
  })

  const reload = useCallback(async () => {
    const load = loaderRef.current
    if (!load) return
    const id = ++run.current
    setLoading(true)
    setError(null)
    try {
      const value = await load()
      if (id === run.current) setDataState(value)
    } catch (err) {
      if (id === run.current) setError(err)
    } finally {
      if (id === run.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const setData = useCallback((value: T | ((prev: T | undefined) => T)) => {
    setDataState((prev) => (typeof value === "function" ? (value as (p: T | undefined) => T)(prev) : value))
  }, [])

  return { data, error, loading, reload, setData }
}

/**
 * Seconds left before the server's rate limiter lets this action through again.
 * Call `trip(error)` with any caught error; it starts the countdown for a RateLimitError.
 */
export function useCooldown() {
  const [until, setUntil] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (until <= Date.now()) return
    const timer = window.setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= until) window.clearInterval(timer)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [until])

  const trip = useCallback((error: unknown) => {
    if (error instanceof RateLimitError) {
      const t = Date.now()
      setNow(t)
      setUntil(t + (error.retryAfter ?? 60) * 1000)
    }
  }, [])

  const remaining = Math.max(0, Math.ceil((until - now) / 1000))
  return { remaining, active: remaining > 0, trip }
}
