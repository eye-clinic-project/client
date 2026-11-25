"use client"

/**
 * Factories for the data hooks used by components (service/*.service.ts).
 *
 * defineQuery()    → `useXQuery(arg, { skip, pollingInterval })`
 *                    returns { data, currentData, error, isLoading, isFetching,
 *                    isError, isSuccess, refetch, fulfilledTimeStamp }.
 * defineMutation() → `useXMutation()` returns `[trigger, state]`.
 *                    `trigger(arg)` resolves to `{ data } | { error }`;
 *                    `trigger(arg).unwrap()` resolves to the data or throws.
 *                    `useXMutation.execute(client, arg)` runs it outside React state.
 *
 * `data` keeps the previous result while a new arg is loading (smooth paging);
 * `currentData` is only the result for the current arg.
 */

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"

import type { Request, RequestArgs } from "@/lib/api/request"

import { IDLE_STATE, type QueryClient, type Tag } from "./client"
import { useQueryClient } from "./provider"

// ── Queries ──────────────────────────────────────────────────────────────────

export interface QueryOptions {
  /** Don't fetch (e.g. while a required arg isn't known yet). */
  skip?: boolean
  /** Refetch every N ms while mounted. */
  pollingInterval?: number
}

interface QueryDefinition<T, A> {
  /** Unique name; part of the cache key. */
  name: string
  query?: (arg: A) => string | RequestArgs
  /** Custom loader, for anything `query` can't express. */
  queryFn?: (arg: A, request: Request) => Promise<T>
  providesTags?: Tag[] | ((data: T, arg: A) => Tag[])
}

/** JSON with sorted keys and no undefined values, so equal args give equal keys. */
function stableStringify(value: unknown): string {
  if (value === undefined) return ""
  return JSON.stringify(value, (_key, inner: unknown) => {
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      return Object.fromEntries(
        Object.entries(inner as Record<string, unknown>)
          .filter(([, v]) => v !== undefined)
          .sort(([a], [b]) => a.localeCompare(b))
      )
    }
    return inner
  })
}

export function defineQuery<T, A = void>(def: QueryDefinition<T, A>) {
  const run = (client: QueryClient, arg: A) =>
    def.queryFn
      ? def.queryFn(arg, client.request)
      : client.request<T>(def.query!(arg))

  const tagsFor = (data: T, arg: A): Tag[] =>
    typeof def.providesTags === "function"
      ? def.providesTags(data, arg)
      : (def.providesTags ?? [])

  return function useQuery(arg: A, options: QueryOptions = {}) {
    const client = useQueryClient()
    const { skip = false, pollingInterval = 0 } = options
    const key = `${def.name}(${stableStringify(arg)})`

    const subscribe = useCallback(
      (listener: () => void) =>
        skip ? () => {} : client.subscribe(key, listener),
      [client, key, skip]
    )
    const state = useSyncExternalStore(
      subscribe,
      () => (skip ? IDLE_STATE : client.getState(key)),
      () => IDLE_STATE
    )

    // Load (or reuse the cache) whenever the key changes.
    const start = useEffectEvent(() => {
      void client.fetch(
        key,
        () => run(client, arg),
        (data: T) => tagsFor(data, arg)
      )
    })
    useEffect(() => {
      if (!skip) start()
    }, [key, skip])

    useEffect(() => {
      if (skip || pollingInterval <= 0) return
      const id = setInterval(() => void client.refetch(key), pollingInterval)
      return () => clearInterval(id)
    }, [client, key, skip, pollingInterval])

    // Remember the last result so `data` survives an arg change.
    const current = state.data as T | undefined
    const [kept, setKept] = useState<T | undefined>(undefined)
    if (current !== undefined && current !== kept) setKept(current)

    const refetch = useCallback(
      () => (skip ? Promise.resolve() : client.refetch(key)),
      [client, key, skip]
    )

    const data = skip ? undefined : (current ?? kept)
    const isFetching =
      !skip && (state.fetching || state.status === "uninitialized")
    return {
      data,
      currentData: skip ? undefined : current,
      error: skip ? undefined : state.error,
      isFetching,
      isLoading: isFetching && data === undefined,
      isError: !skip && state.status === "error",
      isSuccess: !skip && state.status === "success",
      fulfilledTimeStamp: skip ? undefined : state.fulfilledTimeStamp,
      refetch,
    }
  }
}

// ── Mutations ────────────────────────────────────────────────────────────────

interface MutationDefinition<T, A> {
  query?: (arg: A) => string | RequestArgs
  mutationFn?: (arg: A, request: Request) => Promise<T>
  /** Tags to refetch after success. */
  invalidatesTags?: Tag[] | ((result: T, arg: A) => Tag[])
}

export type MutationResult<T> =
  { data: T; error?: undefined } | { data?: undefined; error: unknown }

export type MutationPromise<T> = Promise<MutationResult<T>> & {
  /** Resolves to the data, or throws the error. */
  unwrap(): Promise<T>
}

interface MutationState<T, A> {
  status: "uninitialized" | "pending" | "success" | "error"
  data: T | undefined
  error: unknown
  originalArgs: A | undefined
}

const IDLE_MUTATION: MutationState<never, never> = {
  status: "uninitialized",
  data: undefined,
  error: undefined,
  originalArgs: undefined,
}

export function defineMutation<T, A = void>(def: MutationDefinition<T, A>) {
  async function execute(client: QueryClient, arg: A): Promise<T> {
    const result = def.mutationFn
      ? await def.mutationFn(arg, client.request)
      : await client.request<T>(def.query!(arg))
    client.invalidateTags(
      typeof def.invalidatesTags === "function"
        ? def.invalidatesTags(result, arg)
        : (def.invalidatesTags ?? [])
    )
    return result
  }

  function useMutation() {
    const client = useQueryClient()
    const [state, setState] = useState<MutationState<T, A>>(IDLE_MUTATION)
    const latest = useRef(0)

    const trigger = useCallback(
      (arg: A): MutationPromise<T> => {
        const id = ++latest.current
        setState({ ...IDLE_MUTATION, status: "pending", originalArgs: arg })
        const promise: Promise<MutationResult<T>> = execute(client, arg).then(
          (data) => {
            if (id === latest.current)
              setState({
                status: "success",
                data,
                error: undefined,
                originalArgs: arg,
              })
            return { data }
          },
          (error: unknown) => {
            if (id === latest.current)
              setState({
                status: "error",
                data: undefined,
                error,
                originalArgs: arg,
              })
            return { error }
          }
        )
        return Object.assign(promise, {
          unwrap: () =>
            promise.then((result) => {
              if (result.error !== undefined || !("data" in result))
                throw result.error
              return result.data as T
            }),
        })
      },
      [client]
    )

    const reset = useCallback(() => {
      latest.current++
      setState(IDLE_MUTATION)
    }, [])

    return [
      trigger,
      {
        ...state,
        isUninitialized: state.status === "uninitialized",
        isLoading: state.status === "pending",
        isSuccess: state.status === "success",
        isError: state.status === "error",
        reset,
      },
    ] as const
  }

  return Object.assign(useMutation, { execute })
}
