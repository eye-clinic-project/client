"use client"

/** Seconds countdown (e.g. "resend code in 0:59"). Call `start()` to begin; `label` is m:ss. */

import { useCallback, useEffect, useState } from "react"

export function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (remaining <= 0) return
    const timer = window.setTimeout(
      () => setRemaining((value) => value - 1),
      1_000
    )
    return () => window.clearTimeout(timer)
  }, [remaining])

  const start = useCallback(() => setRemaining(seconds), [seconds])
  const label = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`

  return { remaining, active: remaining > 0, label, start }
}
