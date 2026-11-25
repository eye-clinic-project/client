"use client"

import { useEffect, useState } from "react"

import { fetchProtectedFile } from "@/lib/api/protected-file"

type State =
  | { status: "idle" | "loading"; url: null; type: null }
  | { status: "ready"; url: string; type: string }
  | { status: "error"; url: null; type: null }

const IDLE: State = { status: "idle", url: null, type: null }

export function useProtectedFile(path: string | null | undefined) {
  const [state, setState] = useState<{ path: string | null; value: State }>({
    path: null,
    value: IDLE,
  })

  useEffect(() => {
    if (!path) return
    let cancelled = false
    let objectUrl: string | null = null
    fetchProtectedFile(path).then(
      (blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setState({
          path,
          value: { status: "ready", url: objectUrl, type: blob.type },
        })
      },
      () => {
        if (!cancelled)
          setState({ path, value: { status: "error", url: null, type: null } })
      }
    )
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [path])

  if (!path) return IDLE
  if (state.path !== path)
    return { status: "loading", url: null, type: null } as State
  return state.value
}
