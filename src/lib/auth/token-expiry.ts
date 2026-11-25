/** Decodes one base64url JWT segment into JSON. Throws on malformed input. */
function decodeBase64UrlJson(segment: string): unknown {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/")
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  return JSON.parse(atob(base64 + padding))
}

/** Returns the JWT's `exp` claim in milliseconds, or `null` if it can't be read. */
function readExpiryClaim(jwt: string): number | null {
  try {
    const payload = decodeBase64UrlJson(jwt.split(".")[1] ?? "")
    if (typeof payload !== "object" || payload === null) return null

    const exp = (payload as { exp?: unknown }).exp
    return typeof exp === "number" ? exp * 1000 : null
  } catch {
    return null
  }
}

/**
 * When the access token expires, as a millisecond timestamp.
 *
 * Prefers the token's own `exp` claim (exact), and falls back to the
 * `expiresIn` seconds the backend sent with it.
 */
export function accessTokenExpiry(
  accessToken: string,
  expiresInSeconds: number
): number {
  return readExpiryClaim(accessToken) ?? Date.now() + expiresInSeconds * 1000
}
