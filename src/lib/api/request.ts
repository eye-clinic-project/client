/**
 * Client-side fetch() wrapper used by every query/mutation (see lib/query).
 *
 * Every request:
 * 1. waits until the access token is fresh (tokenStore.ensureFresh),
 * 2. sends `Authorization: Bearer <token>` and `x-language: en|ar`,
 * 3. on 401, refreshes the token once and retries,
 * 4. unwraps the backend's `{ message, data }` envelope → `data`.
 *
 * Failures throw an HttpError `{ status, data }` where `data` is the backend
 * error body, so errorMessage()/useErrorText() can read its `message`.
 */

import { tokenStore } from "@/lib/auth/token-store"
import { publicEnv } from "@/lib/env"
import type { Language } from "@/types/api"

type ParamValue = string | number | boolean | null | undefined

export interface RequestArgs {
  url: string
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  params?: object
  /** Plain objects are sent as JSON; FormData/Blob as-is. */
  body?: unknown
  /** How to read a successful response (default: JSON, falling back to text). */
  responseType?: "json" | "blob"
  cache?: RequestCache
}

/** `status` is the HTTP status, or "FETCH_ERROR" when the server couldn't be reached. */
export class HttpError extends Error {
  readonly status: number | "FETCH_ERROR"
  readonly data: unknown

  constructor(status: number | "FETCH_ERROR", data: unknown) {
    super(
      status === "FETCH_ERROR"
        ? "Network request failed"
        : `Request failed with status ${status}`
    )
    this.name = "HttpError"
    this.status = status
    this.data = data
  }
}

export type Request = <T = unknown>(args: string | RequestArgs) => Promise<T>

function buildUrl(url: string, params?: object) {
  const base = url.startsWith("http") ? url : `${publicEnv.apiUrl}${url}`
  if (!params) return base
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(
    params as Record<string, ParamValue>
  )) {
    if (value !== undefined && value !== null) search.append(key, String(value))
  }
  const query = search.toString()
  return query ? `${base}${base.includes("?") ? "&" : "?"}${query}` : base
}

function isRawBody(body: unknown) {
  return (
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer ||
    typeof body === "string"
  )
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/** Backend successes look like `{ message, data }`; callers only want `data`. */
function unwrap(data: unknown): unknown {
  if (
    typeof data === "object" &&
    data !== null &&
    "data" in data &&
    "message" in data
  ) {
    return (data as { data: unknown }).data
  }
  return data
}

/** Creates the request function. `getLanguage` is read on every call. */
export function createRequest(getLanguage: () => Language): Request {
  async function send(args: RequestArgs): Promise<Response> {
    const headers = new Headers({ "x-language": getLanguage() })
    const token = tokenStore.get()
    if (token) headers.set("authorization", `Bearer ${token}`)

    let body: BodyInit | undefined
    if (args.body !== undefined) {
      if (isRawBody(args.body)) body = args.body as BodyInit
      else {
        headers.set("content-type", "application/json")
        body = JSON.stringify(args.body)
      }
    }

    try {
      return await fetch(buildUrl(args.url, args.params), {
        method: args.method ?? "GET",
        headers,
        body,
        cache: args.cache,
      })
    } catch (error) {
      throw new HttpError("FETCH_ERROR", String(error))
    }
  }

  return async function request<T>(input: string | RequestArgs): Promise<T> {
    const args = typeof input === "string" ? { url: input } : input

    await tokenStore.ensureFresh()
    const sentWith = tokenStore.get()
    let response = await send(args)

    // Unauthorized with a token: it probably just expired.
    // If another request already refreshed it, simply retry; otherwise refresh first.
    if (response.status === 401 && sentWith) {
      const refreshed =
        tokenStore.get() !== sentWith || (await tokenStore.forceRefresh())
      if (refreshed) response = await send(args)
    }

    if (!response.ok)
      throw new HttpError(response.status, await readBody(response))
    if (args.responseType === "blob") return (await response.blob()) as T
    return unwrap(await readBody(response)) as T
  }
}
