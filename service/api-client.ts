import {
  API_BASE_URL,
  API_ORIGIN,
  API_PREFIX,
  clearStoredTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  setStoredTokens,
} from "@/lib/api-config"
import type { ApiResponse, AuthTokens } from "@/lib/api-types"
import { getLocale, messages } from "@/lib/i18n"

export class ApiError extends Error {
  statusCode: number
  /** Machine-readable code some errors carry, e.g. EMAIL_NOT_VERIFIED. */
  code?: string
  details?: unknown

  constructor(message: string, statusCode: number, code?: string, details?: unknown) {
    super(message)
    this.name = "ApiError"
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

/**
 * 429 from the server's rate limiter. `retryAfter` is how long the client is blocked,
 * in seconds, read from the Retry-After header (null when the header is missing).
 */
export class RateLimitError extends ApiError {
  retryAfter: number | null

  constructor(retryAfter: number | null) {
    super(rateLimitMessage(retryAfter), 429, "RATE_LIMITED")
    this.name = "RateLimitError"
    this.retryAfter = retryAfter
  }
}

/** "47 seconds", "5 minutes", "2 hours" in the current UI language. */
export function formatWait(seconds: number): string {
  const time = messages().time
  if (seconds < 60) return time.seconds(seconds)
  const minutes = Math.ceil(seconds / 60)
  if (minutes < 60) return time.minutes(minutes)
  return time.hours(Math.ceil(minutes / 60))
}

function rateLimitMessage(retryAfter: number | null): string {
  return messages().errors.rateLimited(retryAfter ? formatWait(retryAfter) : null)
}

/** A user-facing message for any error thrown by the API layer. */
export function errorMessage(error: unknown, fallback?: string): string {
  const fb = fallback ?? messages().errors.generic
  // Rate-limit text is rebuilt so it follows a language switch made after the error.
  if (error instanceof RateLimitError) return rateLimitMessage(error.retryAfter)
  if (error instanceof ApiError) return error.message || fb
  if (error instanceof Error && error.message) return error.message
  return fb
}

/** Called when the session can no longer be refreshed (SessionProvider redirects to /login). */
let onSessionExpired: (() => void) | null = null
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler
}

/** Error codes the server sends while a doctor's license is not approved yet. */
export const DOCTOR_APPROVAL_CODES = ["DOCTOR_PENDING_APPROVAL", "DOCTOR_REJECTED", "DOCTOR_PROFILE_INCOMPLETE"] as const

export function isDoctorApprovalError(error: unknown): boolean {
  return error instanceof ApiError && (DOCTOR_APPROVAL_CODES as readonly string[]).includes(error.code ?? "")
}

/** Called when a doctor hits a route that needs an approved license (SessionProvider opens /doctor/pending). */
let onApprovalRequired: (() => void) | null = null
export function setApprovalRequiredHandler(handler: (() => void) | null) {
  onApprovalRequired = handler
}

let refreshInFlight: Promise<string | null> | null = null

async function rotateTokens(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) return null
  try {
    const response = await fetch(`${API_BASE_URL}/auth/rotate-token`, {
      method: "POST",
      headers: { Authorization: `Bearer ${refreshToken}` },
    })
    if (!response.ok) return null
    const json = (await response.json()) as ApiResponse<AuthTokens>
    setStoredTokens(json.data)
    return json.data.accessToken
  } catch {
    return null
  }
}

/** Single refresh shared by every request that hit a 401 at the same time. */
function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= rotateTokens().finally(() => {
    refreshInFlight = null
  })
  return refreshInFlight
}

function buildUrl(endpoint: string, query?: QueryParams): string {
  const base = endpoint.startsWith("http")
    ? endpoint
    : endpoint.startsWith(API_PREFIX)
      ? `${API_ORIGIN}${endpoint}`
      : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`
  if (!query) return base
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue
    params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${base}${base.includes("?") ? "&" : "?"}${qs}` : base
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  query?: QueryParams
  /** Return the raw Response (used for file downloads). */
  raw?: boolean
}

async function send(url: string, options: RequestOptions, token: string | null): Promise<Response> {
  const { body, query, raw, ...init } = options
  void query
  void raw
  const headers = new Headers(init.headers)
  const isForm = body instanceof FormData
  if (body !== undefined && !isForm && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`)
  // The server translates its messages (validation, errors) to this language.
  if (!headers.has("x-lang")) headers.set("x-lang", getLocale())
  try {
    return await fetch(url, {
      ...init,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(messages().errors.network, 0)
  }
}

async function toError(response: Response): Promise<ApiError> {
  if (response.status === 429) {
    const header = Number(response.headers.get("Retry-After"))
    return new RateLimitError(Number.isFinite(header) && header > 0 ? Math.ceil(header) : null)
  }
  let body: { message?: unknown; code?: string; error?: string } | null = null
  try {
    body = await response.json()
  } catch {
    body = null
  }
  const raw = body?.message
  const message = Array.isArray(raw)
    ? raw.join(" ")
    : typeof raw === "string"
      ? raw
      : response.statusText || messages().errors.requestFailed
  return new ApiError(message, response.status, body?.code, body)
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(endpoint, options.query)
  let response = await send(url, options, getStoredAccessToken())

  const isAuthRoute = endpoint.startsWith("/auth/") && !endpoint.startsWith("/auth/me")
  if (response.status === 401 && !isAuthRoute && getStoredRefreshToken()) {
    const fresh = await refreshAccessToken()
    if (fresh) {
      response = await send(url, options, fresh)
    } else {
      clearStoredTokens()
      onSessionExpired?.()
    }
  }

  if (!response.ok) {
    const error = await toError(response)
    if (response.status === 403 && isDoctorApprovalError(error)) onApprovalRequired?.()
    throw error
  }
  if (options.raw) return response as T
  if (response.status === 204) return undefined as T

  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json")) return (await response.text()) as T
  const json = await response.json()
  return (json && typeof json === "object" && "data" in json ? json.data : json) as T
}

/** Downloads a protected file (e.g. a report PDF) with the user's token and saves it. */
export async function downloadFile(endpoint: string, filename: string) {
  const response = await apiClient<Response>(endpoint, { raw: true })
  const blob = await response.blob()
  const href = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(href)
}
