/** Server origin, e.g. http://localhost:9090. Every REST route lives under API_PREFIX. */
export const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:9090"

export const API_PREFIX = "/api/v1"

export const API_BASE_URL = `${API_ORIGIN}${API_PREFIX}`

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "retinacare_access_token",
  REFRESH_TOKEN: "retinacare_refresh_token",
} as const

function storage(): Storage | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function getStoredAccessToken(): string | null {
  return storage()?.getItem(STORAGE_KEYS.ACCESS_TOKEN) ?? null
}

export function getStoredRefreshToken(): string | null {
  return storage()?.getItem(STORAGE_KEYS.REFRESH_TOKEN) ?? null
}

export function setStoredTokens(tokens: { accessToken: string; refreshToken: string }) {
  const store = storage()
  if (!store) return
  store.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken)
  store.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)
}

export function clearStoredTokens() {
  const store = storage()
  if (!store) return
  store.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  store.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
}

/**
 * The server returns paths such as `/api/v1/files/image/<id>?exp=…&sig=…` for private files.
 * Signed URLs work in <img> tags without an Authorization header.
 */
export function assetUrl(path?: string | null): string {
  if (!path) return ""
  if (/^https?:\/\//.test(path)) return path
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`
}
