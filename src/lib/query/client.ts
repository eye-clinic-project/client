/**
 * Tiny client-side request cache.
 *
 * - Each query result is cached under a key (endpoint name + serialized arg).
 * - Queries "provide" tags, mutations "invalidate" them: invalidated entries that
 *   are on screen refetch right away; the rest are dropped and refetch on next use.
 * - Concurrent fetches of the same key are de-duplicated.
 * - Entries nobody uses any more are removed after KEEP_UNUSED_MS.
 *
 * One QueryClient is created per browser tab in QueryProvider (never a global,
 * the server would share it between users).
 */

import { createRequest, type Request } from "@/lib/api/request"
import type { Language } from "@/types/api"

export type TagType =
  | "Me"
  | "Analysis"
  | "AiHealth"
  | "Appointment"
  | "Report"
  | "Notification"
  | "Doctor"
  | "DoctorVerification"
  | "Patient"
  | "Conversation"
  | "Message"
  | "AdminDoctor"
  | "Review"
  | "Slot"

/** A bare type matches every tag of that type; `{ type, id }` matches that id only. */
export type Tag = TagType | { type: TagType; id: string }

export type QueryStatus = "uninitialized" | "pending" | "success" | "error"

export interface QueryState<T = unknown> {
  status: QueryStatus
  data: T | undefined
  error: unknown
  /** True while a request is in flight (first load or refetch). */
  fetching: boolean
  fulfilledTimeStamp: number | undefined
}

interface Entry {
  state: QueryState
  tags: Tag[]
  listeners: Set<() => void>
  run: (() => Promise<unknown>) | null
  provides: ((data: unknown) => Tag[]) | null
  inFlight: Promise<void> | null
  /** Bumped on reset/invalidate so a stale in-flight response is ignored. */
  generation: number
  gcTimer: ReturnType<typeof setTimeout> | undefined
}

const KEEP_UNUSED_MS = 60_000

export const IDLE_STATE: QueryState = Object.freeze({
  status: "uninitialized",
  data: undefined,
  error: undefined,
  fetching: false,
  fulfilledTimeStamp: undefined,
}) as QueryState

function tagMatches(provided: Tag, invalidated: Tag) {
  if (typeof invalidated === "string") {
    return (
      (typeof provided === "string" ? provided : provided.type) === invalidated
    )
  }
  return (
    typeof provided !== "string" &&
    provided.type === invalidated.type &&
    provided.id === invalidated.id
  )
}

export class QueryClient {
  readonly request: Request
  private entries = new Map<string, Entry>()

  constructor(getLanguage: () => Language) {
    this.request = createRequest(getLanguage)
  }

  private entry(key: string): Entry {
    let entry = this.entries.get(key)
    if (!entry) {
      entry = {
        state: IDLE_STATE,
        tags: [],
        listeners: new Set(),
        run: null,
        provides: null,
        inFlight: null,
        generation: 0,
        gcTimer: undefined,
      }
      this.entries.set(key, entry)
    }
    return entry
  }

  private setState(entry: Entry, patch: Partial<QueryState>) {
    entry.state = { ...entry.state, ...patch }
    entry.listeners.forEach((listener) => listener())
  }

  getState(key: string): QueryState {
    return this.entries.get(key)?.state ?? IDLE_STATE
  }

  subscribe(key: string, listener: () => void) {
    const entry = this.entry(key)
    clearTimeout(entry.gcTimer)
    entry.listeners.add(listener)
    return () => {
      entry.listeners.delete(listener)
      if (entry.listeners.size === 0) {
        entry.gcTimer = setTimeout(() => {
          if (entry.listeners.size === 0 && this.entries.get(key) === entry)
            this.entries.delete(key)
        }, KEEP_UNUSED_MS)
      }
    }
  }

  /**
   * Registers how to load `key` and loads it unless it is cached (or `force`).
   * Resolves when done; never rejects (errors land in the state).
   */
  fetch<T>(
    key: string,
    run: () => Promise<T>,
    provides: (data: T) => Tag[],
    force = false
  ): Promise<void> {
    const entry = this.entry(key)
    entry.run = run
    entry.provides = provides as (data: unknown) => Tag[]
    if (entry.inFlight) return entry.inFlight
    if (!force && entry.state.status === "success") return Promise.resolve()
    return this.load(key, entry)
  }

  /** Re-runs a known query (polling, refetch(), invalidation). */
  refetch(key: string): Promise<void> {
    const entry = this.entries.get(key)
    if (!entry?.run) return Promise.resolve()
    return entry.inFlight ?? this.load(key, entry)
  }

  private load(key: string, entry: Entry): Promise<void> {
    const run = entry.run!
    const generation = entry.generation
    this.setState(entry, {
      fetching: true,
      status: entry.state.status === "success" ? "success" : "pending",
    })
    const promise = run().then(
      (data) => {
        if (entry.generation !== generation) return
        entry.tags = entry.provides?.(data) ?? []
        this.setState(entry, {
          status: "success",
          data,
          error: undefined,
          fetching: false,
          fulfilledTimeStamp: Date.now(),
        })
      },
      (error: unknown) => {
        if (entry.generation !== generation) return
        // Keep the last good data but flag the error.
        this.setState(entry, { status: "error", error, fetching: false })
      }
    )
    const tracked: Promise<void> = promise.finally(() => {
      if (entry.inFlight === tracked) entry.inFlight = null
    })
    entry.inFlight = tracked
    return tracked
  }

  /** Refetches on-screen queries that provide any of `tags`; drops the rest. */
  invalidateTags(tags: Tag[]) {
    if (tags.length === 0) return
    for (const [key, entry] of this.entries) {
      const hit = entry.tags.some((provided) =>
        tags.some((tag) => tagMatches(provided, tag))
      )
      if (!hit) continue
      entry.generation++
      entry.inFlight = null
      if (entry.listeners.size > 0) void this.load(key, entry)
      else {
        clearTimeout(entry.gcTimer)
        this.entries.delete(key)
      }
    }
  }

  /** Forgets all cached data (sign-out, language change); on-screen queries reload. */
  reset() {
    for (const [key, entry] of this.entries) {
      entry.generation++
      entry.inFlight = null
      entry.tags = []
      if (entry.listeners.size > 0) {
        entry.state = IDLE_STATE
        if (entry.run) void this.load(key, entry)
        else entry.listeners.forEach((listener) => listener())
      } else {
        clearTimeout(entry.gcTimer)
        this.entries.delete(key)
      }
    }
  }
}
